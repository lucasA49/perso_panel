// Vérifie chaque minute les rappels à déclencher et envoie les notifications.
import cron from 'node-cron';
import { query } from './db/pool.js';
import { sendToAll } from './push.js';

function nextOccurrence(date, recurrence) {
  const d = new Date(date);
  switch (recurrence) {
    case 'daily': d.setDate(d.getDate() + 1); return d;
    case 'weekly': d.setDate(d.getDate() + 7); return d;
    case 'monthly': d.setMonth(d.getMonth() + 1); return d;
    default: return null;
  }
}

async function checkReminders() {
  const { rows } = await query(
    `SELECT * FROM reminders
     WHERE enabled = TRUE AND remind_at <= now()
       AND (last_fired_at IS NULL OR last_fired_at < remind_at)`
  );

  for (const r of rows) {
    try {
      await sendToAll({ title: r.title, body: r.body || '', url: '/', tag: `reminder-${r.id}` });

      const next = nextOccurrence(r.remind_at, r.recurrence);
      if (next) {
        // Rappel récurrent : on reprogramme la prochaine occurrence
        await query('UPDATE reminders SET last_fired_at = now(), remind_at = $1 WHERE id = $2', [next, r.id]);
      } else {
        // Rappel unique : on le désactive après envoi
        await query('UPDATE reminders SET last_fired_at = now(), enabled = FALSE WHERE id = $1', [r.id]);
      }
      console.log(`[scheduler] Rappel envoyé : "${r.title}"`);
    } catch (err) {
      console.error('[scheduler] Erreur sur un rappel :', err.message);
    }
  }
}

export function startScheduler() {
  cron.schedule('* * * * *', () => {
    checkReminders().catch((e) => console.error('[scheduler]', e.message));
  });
  console.log('[scheduler] Démarré (vérification chaque minute)');
}
