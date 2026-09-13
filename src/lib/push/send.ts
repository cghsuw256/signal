import { FCM_TOPIC } from "./config";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
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

export function canSendPush(): boolean {
  return Boolean(serverKey());
}

export async function subscribeToken(token: string): Promise<void> {
  const key = serverKey();
  if (!key) throw new Error("FCM_SERVER_KEY가 없습니다.");
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
        notification: {
          title: payload.title,
          body: payload.body,
          icon: "/favicon.svg",
        },
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
