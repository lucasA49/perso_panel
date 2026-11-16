import { query } from "@/lib/db";
import { handle } from "@/lib/http";

// Export / sauvegarde des données au format JSON
export const GET = handle(async () => {
  const settings = await query("SELECT key, value FROM settings");
  const expenses = await query("SELECT label, amount, category, active FROM fixed_expenses");
  const reminders = await query("SELECT title, body, remind_at, recurrence, enabled FROM reminders");

  return Response.json(
    {
      exported_at: new Date().toISOString(),
      settings: settings.rows,
      expenses: expenses.rows,
      reminders: reminders.rows,
    },
    { headers: { "Content-Disposition": 'attachment; filename="perso-panel-backup.json"' } }
  );
});
