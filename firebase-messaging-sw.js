importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");
firebase.initializeApp({"apiKey":"AIzaSyCQMXtrxVmmqE9OX_kprHYRsuXcd1a2Ku4","projectId":"signal-ff879","appId":"1:535833006397:web:ca4d3a6eee25a546ba3554","messagingSenderId":"535833006397","vapidKey":"BAKI2Z4Sf_8odWh28ZmBWVQawNZqKkoabMTdkpVWe0i0BryYqSRGMmaAowvd8_3XoUwVIUDJsdANdir0IVgIFS4","authDomain":"signal-ff879.firebaseapp.com","storageBucket":"signal-ff879.firebasestorage.app"});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const d = payload.data || {};
  const title = n.title || d.title || "시그널 모닝 리포트";
  const body = n.body || d.body || "오늘 아침 보안 이슈를 확인해 주세요.";
  const url = (payload.fcmOptions && payload.fcmOptions.link) || d.url || "./";
  return self.registration.showNotification(title, {
    body,
    icon: "apple-touch-icon.png",
    badge: "apple-touch-icon.png",
    data: { url },
  });
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "./";
  event.waitUntil(clients.openWindow(url));
});
