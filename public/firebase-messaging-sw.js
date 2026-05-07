const FIREBASE_COMPAT_VERSION = "10.14.1";

function getFirebaseConfig() {
  const params = new URL(self.location.href).searchParams;

  return {
    apiKey: params.get("apiKey"),
    authDomain: params.get("authDomain"),
    projectId: params.get("projectId"),
    storageBucket: params.get("storageBucket") || undefined,
    messagingSenderId: params.get("messagingSenderId"),
    appId: params.get("appId"),
    measurementId: params.get("measurementId") || undefined,
  };
}

importScripts(
  `https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-app-compat.js`,
);
importScripts(
  `https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-messaging-compat.js`,
);

const firebaseConfig = getFirebaseConfig();

if (
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "Coleta de lixo em breve";
    const options = {
      body:
        payload.notification?.body ||
        "O caminhão de coleta passa em aproximadamente 10 minutos.",
      icon: "/vite.svg",
      badge: "/vite.svg",
      data: payload.data || {},
    };

    self.registration.showNotification(title, options);
  });
}
