import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";
import { FCM_TOKEN_KEY, pushAssetBase, readFirebaseWebConfig } from "./config";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function isPushReady(): boolean {
  return Boolean(readFirebaseWebConfig());
}

export function savedPushToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(FCM_TOKEN_KEY);
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

async function getApp(): Promise<{ app: FirebaseApp; messaging: Messaging; vapidKey: string }> {
  const config = readFirebaseWebConfig();
  if (!config) throw new Error("Firebase 키가 없습니다.");
  if (!(await isSupported())) throw new Error("이 브라우저는 웹 푸시를 지원하지 않습니다.");
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
  }
  messaging ??= getMessaging(app);
  return { app, messaging, vapidKey: config.vapidKey };
}

export async function enablePush(): Promise<string> {
  const { messaging, vapidKey } = await getApp();
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("알림 권한이 거부되었습니다.");

  const base = pushAssetBase();
  const registration = await navigator.serviceWorker.register(`${base}firebase-messaging-sw.js`, {
    scope: base,
  });
  await navigator.serviceWorker.ready;

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("FCM 토큰을 발급받지 못했습니다.");
  window.localStorage.setItem(FCM_TOKEN_KEY, token);
  onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "SIGNAL";
    const body = payload.notification?.body ?? "모닝 리포트가 도착했습니다.";
    void new Notification(title, { body, icon: `${base}favicon.svg` });
  });
  return token;
}

export async function disablePush(): Promise<void> {
  window.localStorage.removeItem(FCM_TOKEN_KEY);
}
