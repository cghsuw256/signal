import { importPKCS8, SignJWT } from "jose";
import { FCM_TOPIC } from "./config";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function serverKey(): string | undefined {
  return process.env.FCM_SERVER_KEY?.trim();
}

function deviceTokens(): string[] {
  return (process.env.FCM_DEVICE_TOKEN ?? "")
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function canSendPush(): boolean {
  return Boolean(readServiceAccount() || serverKey());
}

async function googleAccessToken(sa: ServiceAccount): Promise<string> {
  const pem = sa.private_key.replace(/\\n/g, "\n");
  const key = await importPKCS8(pem, "RS256");
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(`Google 토큰 발급 실패 ${json.error ?? res.status}`);
  }
  return json.access_token;
}

function publicOrigin(): string {
  const raw = process.env.SIGNAL_PUBLIC_URL?.trim() || "https://cghsuw256.github.io/signal/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function messageBody(payload: PushPayload, target: { topic?: string; token?: string }) {
  const origin = publicOrigin();
  const link = payload.url || origin;
  const icon = `${origin}apple-touch-icon.png`;
  return {
    message: {
      ...target,
      notification: { title: payload.title, body: payload.body },
      data: {
        url: link,
        title: payload.title,
        body: payload.body,
      },
      webpush: {
        headers: { Urgency: "high", TTL: "86400" },
        notification: {
          title: payload.title,
          body: payload.body,
          icon,
          badge: icon,
        },
        fcm_options: { link },
      },
    },
  };
}

async function sendV1(payload: PushPayload): Promise<{ sent: number }> {
  const sa = readServiceAccount();
  if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT가 없습니다.");
  const access = await googleAccessToken(sa);
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  const targets: Array<{ topic?: string; token?: string }> = [{ topic: FCM_TOPIC }];
  for (const token of deviceTokens()) targets.push({ token });

  let sent = 0;
  for (const target of targets) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageBody(payload, target)),
    });
    if (!res.ok) {
      const text = await res.text();
      const who = target.token ? "device" : "topic";
      console.error(`[fcm] ${who} fail ${res.status} ${text.slice(0, 240)}`);
      continue;
    }
    sent += 1;
  }
  if (sent === 0) throw new Error("FCM 발송 실패: 수신 대상이 없습니다.");
  return { sent };
}

async function sendLegacy(payload: PushPayload): Promise<{ sent: number }> {
  const key = serverKey();
  if (!key) throw new Error("FCM_SERVER_KEY가 없습니다.");
  const targets = [`/topics/${FCM_TOPIC}`, ...deviceTokens()];
  let sent = 0;
  for (const to of targets) {
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        priority: "high",
        notification: { title: payload.title, body: payload.body, icon: "/favicon.svg" },
        data: { url: payload.url ?? "" },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`FCM 발송 실패 (${res.status}) ${text.slice(0, 180)}`);
    }
    sent += 1;
  }
  return { sent };
}

export async function subscribeToken(token: string): Promise<void> {
  const sa = readServiceAccount();
  if (sa) {
    const access = await googleAccessToken(sa);
    const res = await fetch(
      `https://iid.googleapis.com/iid/v1/${encodeURIComponent(token)}/rel/topics/${FCM_TOPIC}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
          access_token_auth: "true",
        },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`토픽 구독 실패 (${res.status}) ${text.slice(0, 180)}`);
    }
    return;
  }
  const key = serverKey();
  if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT가 없습니다.");
  const res = await fetch(
    `https://iid.googleapis.com/iid/v1/${encodeURIComponent(token)}/rel/topics/${FCM_TOPIC}`,
    { method: "POST", headers: { Authorization: `key=${key}` } },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`토픽 구독 실패 (${res.status}) ${text.slice(0, 180)}`);
  }
}

export async function sendPush(payload: PushPayload): Promise<{ sent: number }> {
  if (readServiceAccount()) return sendV1(payload);
  if (serverKey()) return sendLegacy(payload);
  throw new Error("FIREBASE_SERVICE_ACCOUNT JSON을 넣으세요. Legacy 서버 키는 이 프로젝트에서 사용 중지입니다.");
}
