import { query } from "@/lib/db";
import { readAmount, resolveDay } from "@/lib/entries";
import { commitState } from "@/lib/history";
import { badRequest, handle, json, readBody } from "@/lib/http";

// Ajoute un revenu du mois (prime, vente, remboursement…) avec sa source
export const POST = handle(async (request) => {
  const { source, amount, day: requested } = await readBody(request);
  if (!source || !String(source).trim()) return badRequest("Source requise");
  const amt = readAmount(amount);
  if (amt === null) return badRequest("Montant invalide");
  const { day, error } = await resolveDay(requested);
  if (error) return badRequest(error);

  await query("INSERT INTO incomes (source, amount, received_on) VALUES ($1, $2, $3)", [
    String(source).trim(),
    amt,
    day,
  ]);
  return json(await commitState(), 201);
});
