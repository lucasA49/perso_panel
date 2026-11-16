import { getFullState } from "@/lib/budget";
import { query } from "@/lib/db";
import { badRequest, handle, json, readBody } from "@/lib/http";

// Ajoute une dépense fixe
export const POST = handle(async (request) => {
  const { label, amount, category } = await readBody(request);
  if (!label || !String(label).trim()) return badRequest("Libellé requis");
  const amt = Number(amount);
  if (Number.isNaN(amt) || amt < 0) return badRequest("Montant invalide");

  await query("INSERT INTO fixed_expenses (label, amount, category) VALUES ($1, $2, $3)", [
    String(label).trim(),
    amt,
    (category && String(category).trim()) || "Autre",
  ]);
  return json(await getFullState(), 201);
});
