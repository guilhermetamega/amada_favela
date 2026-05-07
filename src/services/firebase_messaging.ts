type FirebaseCompatApp = {
  apps: unknown[];
  initializeApp: (config: FirebaseWebConfig) => unknown;
  messaging: () => {
    getToken: (options: {
      vapidKey: string;
      serviceWorkerRegistration: ServiceWorkerRegistration;
    }) => Promise<string | null>;
  };
};

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

declare global {
  interface Window {
    firebase?: FirebaseCompatApp;
  }
}

const FIREBASE_COMPAT_VERSION = "10.14.1";
const FIREBASE_APP_SCRIPT = `https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-app-compat.js`;
const FIREBASE_MESSAGING_SCRIPT = `https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-messaging-compat.js`;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );

    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
    document.head.appendChild(script);
  });
}

export function getFirebaseWebConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  } satisfies Partial<FirebaseWebConfig>;

  if (
    !config.apiKey ||
    !config.authDomain ||
    !config.projectId ||
    !config.messagingSenderId ||
    !config.appId
  ) {
    return null;
  }

  return config as FirebaseWebConfig;
}

export function getFirebaseVapidKey() {
  return import.meta.env.VITE_FIREBASE_VAPID_KEY || null;
}

export function isPushMessagingSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

async function getFirebaseMessaging(config: FirebaseWebConfig) {
  await loadScript(FIREBASE_APP_SCRIPT);
  await loadScript(FIREBASE_MESSAGING_SCRIPT);

  if (!window.firebase) {
    throw new Error("Firebase Messaging não foi inicializado.");
  }

  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(config);
  }

  return window.firebase.messaging();
}

function buildServiceWorkerUrl(config: FirebaseWebConfig) {
  const params = new URLSearchParams({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  });

  if (config.storageBucket) params.set("storageBucket", config.storageBucket);
  if (config.measurementId) params.set("measurementId", config.measurementId);

  return `/firebase-messaging-sw.js?${params.toString()}`;
}

export async function requestGarbagePushToken() {
  if (!isPushMessagingSupported()) {
    throw new Error("Este navegador não oferece suporte a notificações push.");
  }

  const config = getFirebaseWebConfig();
  const vapidKey = getFirebaseVapidKey();

  if (!config || !vapidKey) {
    throw new Error("Firebase Web Config ou VAPID Key não configurados.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Permissão de notificação negada pelo navegador.");
  }

  const registration = await navigator.serviceWorker.register(
    buildServiceWorkerUrl(config),
  );
  const messaging = await getFirebaseMessaging(config);
  const token = await messaging.getToken({
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Firebase não retornou um token FCM para este navegador.");
  }

  return token;
}
