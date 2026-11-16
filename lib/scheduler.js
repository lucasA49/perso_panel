// Vérifie chaque minute les rappels à déclencher et envoie les notifications.
import "server-only";
import { query } from "./db";
import { ensureCurrentSnapshot } from "./history";
import { sendToAll } from "./push";

// Prochaine occurrence strictement dans le futur (évite une rafale après une coupure)
function nextOccurrence(date, recurrence) {
  if (!["daily", "weekly", "monthly"].includes(recurrence)) return null;
  const d = new Date(date);
  const now = Date.now();
  do {
    if (recurrence === "daily") d.setDate(d.getDate() + 1);
    else if (recurrence === "weekly") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  } while (d.getTime() <= now);
  return d;
}

export async function checkReminders() {
  const { rows } = await query(
    `SELECT * FROM reminders
     WHERE enabled = TRUE AND remind_at <= now()
       AND (last_fired_at IS NULL OR last_fired_at < remind_at)`
  );

  let fired = 0;
  for (const r of rows) {
    try {
      await sendToAll({ title: r.title, body: r.body || "", url: "/", tag: `reminder-${r.id}` });

      const next = nextOccurrence(r.remind_at, r.recurrence);
      if (next) {
        // Rappel récurrent : on reprogramme la prochaine occurrence
        await query("UPDATE reminders SET last_fired_at = now(), remind_at = $1 WHERE id = $2", [next, r.id]);
      } else {
        // Rappel unique : on le désactive après envoi
        await query("UPDATE reminders SET last_fired_at = now(), enabled = FALSE WHERE id = $1", [r.id]);
      }
      fired += 1;
      console.log(`[scheduler] Rappel envoyé : "${r.title}"`);
    } catch (err) {
      console.error("[scheduler] Erreur sur un rappel :", err.message);
    }
  }
  return { fired };
}

export function startScheduler() {
  if (globalThis.__persoPanelScheduler) return;
  const timer = setInterval(() => {
    checkReminders().catch((e) => console.error("[scheduler]", e.message));
    // Au changement de mois, ouvre la nouvelle ligne de l'historique
    ensureCurrentSnapshot().catch((e) => console.error("[history]", e.message));
  }, 60_000);
  timer.unref?.();
  globalThis.__persoPanelScheduler = timer;
  console.log("[scheduler] Démarré (vérification chaque minute)");
}
