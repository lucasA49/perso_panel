import { getFullState } from "@/lib/budget";
import { query } from "@/lib/db";
import { readAmount, resolveDay } from "@/lib/entries";
import { badRequest, handle, json, readBody } from "@/lib/http";

// Ajoute une dépense réelle (un achat) à la date donnée, aujourd'hui par défaut
export const POST = handle(async (request) => {
  const { label, amount, category, day: requested } = await readBody(request);
  if (!label || !String(label).trim()) return badRequest("Libellé requis");
  const amt = readAmount(amount);
  if (amt === null) return badRequest("Montant invalide");
  const { day, error } = await resolveDay(requested);
  if (error) return badRequest(error);

  await query("INSERT INTO transactions (label, amount, category, spent_on) VALUES ($1, $2, $3, $4)", [
    String(label).trim(),
    amt,
    (category && String(category).trim()) || "Autre",
    day,
  ]);
  return json(await getFullState(), 201);
});
