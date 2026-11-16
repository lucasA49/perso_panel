import { today } from "@/lib/dates";
import { query } from "@/lib/db";
import { readAmount } from "@/lib/entries";
import { getGoals } from "@/lib/goals";
import { badRequest, handle, json, readBody, readId } from "@/lib/http";

// Ajoute de l'argent à un objectif (versement daté d'aujourd'hui)
export const POST = handle(async (request, context) => {
  const id = await readId(context);
  if (!id) return badRequest("Identifiant invalide");
  const { amount } = await readBody(request);
  const value = readAmount(amount);
  if (value === null) return badRequest("Montant invalide");

  const { rows } = await query("SELECT 1 FROM savings_goals WHERE id = $1", [id]);
  if (!rows.length) return json({ error: "Objectif introuvable" }, 404);

  await query("INSERT INTO savings_deposits (goal_id, amount, day) VALUES ($1, $2, $3)", [id, value, today()]);
  return json(await getGoals(), 201);
});
