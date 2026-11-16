// Envoi des notifications Web Push aux appareils abonnés (serveur uniquement)
import "server-only";
import { sendNotification, setVapidDetails } from "web-push";
import { query } from "./db";

export const pushConfigured = () =>
  Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

// Envoie une notification à tous les appareils abonnés.
// Supprime automatiquement les abonnements morts (410/404).
export async function sendToAll(payload) {
  if (!pushConfigured()) return { sent: 0, removed: 0 };

  setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const { rows } = await query("SELECT endpoint, data FROM push_subscriptions");
  let sent = 0;
  let removed = 0;

  await Promise.all(
    rows.map(async (row) => {
      try {
        await sendNotification(row.data, JSON.stringify(payload));
        sent += 1;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await query("DELETE FROM push_subscriptions WHERE endpoint = $1", [row.endpoint]);
          removed += 1;
        } else {
          console.error("[push] Échec envoi :", err.statusCode, err.body || err.message);
        }
      }
    })
  );

  return { sent, removed };
}
