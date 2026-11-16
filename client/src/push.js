// Activation des notifications push côté navigateur (iOS 16.4+ une fois l'app sur l'écran d'accueil)
import { api } from './api.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function enablePush() {
  if (!pushSupported()) {
    throw new Error("Ton appareil ne supporte pas les notifications ici. Sur iPhone : ajoute d'abord l'app à l'écran d'accueil, puis rouvre-la.");
  }

  const { publicKey, configured } = await api.getVapid();
  if (!configured || !publicKey) {
    throw new Error('Les notifications ne sont pas configurées côté serveur (clés VAPID manquantes).');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permission refusée. Autorise les notifications dans les réglages.');
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await api.subscribePush(sub.toJSON());
  return true;
}
