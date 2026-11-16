// Gestion des notifications Web Push (envoi aux appareils abonnés)
import webpush from 'web-push';
import dotenv from 'dotenv';
import { query } from './db/pool.js';

dotenv.config();

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

export const pushConfigured = Boolean(publicKey && privateKey);

if (pushConfigured) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
} else {
  console.warn('[push] Clés VAPID manquantes — notifications désactivées. Lance "npm run gen-vapid".');
}

// Envoie une notification à tous les appareils abonnés.
// Supprime automatiquement les abonnements morts (410/404).
export async function sendToAll(payload) {
  if (!pushConfigured) return { sent: 0, removed: 0 };

  const { rows } = await query('SELECT endpoint, data FROM push_subscriptions');
  let sent = 0;
  let removed = 0;

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(row.data, JSON.stringify(payload));
        sent += 1;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [row.endpoint]);
          removed += 1;
        } else {
          console.error('[push] Échec envoi :', err.statusCode, err.body || err.message);
        }
      }
    })
  );

  return { sent, removed };
}
