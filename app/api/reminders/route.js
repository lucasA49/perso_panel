import { query } from "@/lib/db";
import { badRequest, handle, json, readBody } from "@/lib/http";
import { RECURRENCES } from "@/lib/reminders";

export const GET = handle(async () => {
  const { rows } = await query("SELECT * FROM reminders ORDER BY remind_at ASC");
  return json(rows);
});

export const POST = handle(async (request) => {
  const { title, body, remind_at, recurrence } = await readBody(request);
  if (!title || !String(title).trim()) return badRequest("Titre requis");
  if (!remind_at || Number.isNaN(Date.parse(remind_at))) return badRequest("Date invalide");
  const rec = RECURRENCES.includes(recurrence) ? recurrence : "none";

  const { rows } = await query(
    `INSERT INTO reminders (title, body, remind_at, recurrence)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [String(title).trim(), String(body || "").trim(), remind_at, rec]
  );
  return json(rows[0], 201);
});
