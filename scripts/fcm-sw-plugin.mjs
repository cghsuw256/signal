/** Serves / writes firebase-messaging-sw.js from VITE_FIREBASE_* env. */

function firebaseWebConfig() {
  const apiKey = process.env.VITE_FIREBASE_API_KEY?.trim();
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const appId = process.env.VITE_FIREBASE_APP_ID?.trim();
  const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const vapidKey = process.env.VITE_FIREBASE_VAPID_KEY?.trim();
  if (!apiKey || !projectId || !appId || !messagingSenderId || !vapidKey) return null;
  return {
    apiKey,
    projectId,
    appId,
    messagingSenderId,
    vapidKey,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || `${projectId}.firebaseapp.com`,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || `${projectId}.appspot.com`,
  };
}

export function renderFcmServiceWorker() {
  const config = firebaseWebConfig();
  if (!config) {
    return `/* Firebase 키가 없어 FCM 워커가 비활성입니다. */\nself.addEventListener("fetch", () => {});\n`;
  }
  const json = JSON.stringify(config);
  return `importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");
firebase.initializeApp(${json});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const title = n.title || "SIGNAL";
  const body = n.body || "모닝 리포트가 도착했습니다.";
  return self.registration.showNotification(title, {
    body,
    icon: "favicon.svg",
    data: { url: (payload.fcmOptions && payload.fcmOptions.link) || (payload.data && payload.data.url) || "./" },
  });
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "./";
  event.waitUntil(clients.openWindow(url));
});
`;
}

export function fcmSwPlugin() {
  const name = "signal-fcm-sw";
  return {
    name,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? "").split("?", 1)[0];
        if (path !== "/firebase-messaging-sw.js") {
          next();
          return;
        }
        const body = renderFcmServiceWorker();
        res.statusCode = 200;
        res.setHeader("content-type", "application/javascript; charset=utf-8");
        res.setHeader("service-worker-allowed", "/");
        res.end(body);
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "firebase-messaging-sw.js",
        source: renderFcmServiceWorker(),
      });
    },
  };
}
