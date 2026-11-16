import { query } from "@/lib/db";
import { badRequest, handle, json, readBody, readId } from "@/lib/http";
import { RECURRENCES } from "@/lib/reminders";

export const PATCH = handle(async (request, context) => {
  const id = await readId(context);
  if (!id) return badRequest("Identifiant invalide");

  const { title, body, remind_at, recurrence, enabled } = await readBody(request);
  const fields = [];
  const values = [];
  const set = (column, value) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (title !== undefined) {
    if (!String(title).trim()) return badRequest("Titre requis");
    set("title", String(title).trim());
  }
  if (body !== undefined) set("body", String(body).trim());
  if (remind_at !== undefined) {
    if (Number.isNaN(Date.parse(remind_at))) return badRequest("Date invalide");
    set("remind_at", remind_at);
  }
  if (recurrence !== undefined) {
    if (!RECURRENCES.includes(recurrence)) return badRequest("Récurrence invalide");
    set("recurrence", recurrence);
  }
  if (enabled !== undefined) set("enabled", Boolean(enabled));

  if (!fields.length) return badRequest("Rien à modifier");
  values.push(id);
  const { rows } = await query(
    `UPDATE reminders SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!rows.length) return json({ error: "Rappel introuvable" }, 404);
  return json(rows[0]);
});

export const DELETE = handle(async (request, context) => {
  const id = await readId(context);
  if (!id) return badRequest("Identifiant invalide");
  await query("DELETE FROM reminders WHERE id = $1", [id]);
  return json({ ok: true });
});
