import { getFullState } from "@/lib/budget";
import { today } from "@/lib/dates";
import { query } from "@/lib/db";
import { ensureCurrentSnapshot } from "@/lib/history";
import { badRequest, handle, json, readBody } from "@/lib/http";

const isDay = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

// Ajoute une dépense réelle (un achat) à la date donnée, aujourd'hui par défaut
export const POST = handle(async (request) => {
  const { label, amount, category, spent_on } = await readBody(request);
  if (!label || !String(label).trim()) return badRequest("Libellé requis");
  const amt = Number(amount);
  if (Number.isNaN(amt) || amt <= 0) return badRequest("Montant invalide");

  const day = spent_on === undefined || spent_on === "" ? today() : spent_on;
  if (!isDay(day)) return badRequest("Date invalide");
  if (day > today()) return badRequest("La date ne peut pas être dans le futur");

  // La dépense doit tomber dans un mois présent dans l'historique, sinon elle serait invisible
  await ensureCurrentSnapshot();
  const { rows } = await query("SELECT min(month) AS first FROM monthly_snapshots");
  if (day.slice(0, 7) < rows[0].first) return badRequest("Date antérieure au début de l'historique");

  await query("INSERT INTO transactions (label, amount, category, spent_on) VALUES ($1, $2, $3, $4)", [
    String(label).trim(),
    amt,
    (category && String(category).trim()) || "Autre",
    day,
  ]);
  return json(await getFullState(), 201);
});
