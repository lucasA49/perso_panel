import { query } from "@/lib/db";
import { readAmount } from "@/lib/entries";
import { getGoals } from "@/lib/goals";
import { badRequest, handle, json, readBody } from "@/lib/http";

export const GET = handle(async () => json(await getGoals()));

// Crée un objectif d'épargne (nom + montant à atteindre)
export const POST = handle(async (request) => {
  const { name, target } = await readBody(request);
  if (!name || !String(name).trim()) return badRequest("Nom requis");
  const amount = readAmount(target);
  if (amount === null) return badRequest("Montant de l'objectif invalide");

  await query("INSERT INTO savings_goals (name, target) VALUES ($1, $2)", [String(name).trim(), amount]);
  return json(await getGoals(), 201);
});
