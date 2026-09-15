importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");
firebase.initializeApp({"apiKey":"AIzaSyCQMXtrxVmmqE9OX_kprHYRsuXcd1a2Ku4","projectId":"signal-ff879","appId":"1:535833006397:web:ca4d3a6eee25a546ba3554","messagingSenderId":"535833006397","vapidKey":"BAKI2Z4Sf_8odWh28ZmBWVQawNZqKkoabMTdkpVWe0i0BryYqSRGMmaAowvd8_3XoUwVIUDJsdANdir0IVgIFS4","authDomain":"signal-ff879.firebaseapp.com","storageBucket":"signal-ff879.firebasestorage.app"});
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
