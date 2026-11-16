import { query } from "@/lib/db";
import { getGoals } from "@/lib/goals";
import { badRequest, handle, json, readId } from "@/lib/http";

// Annule un versement
export const DELETE = handle(async (request, context) => {
  const id = await readId(context);
  if (!id) return badRequest("Identifiant invalide");
  await query("DELETE FROM savings_deposits WHERE id = $1", [id]);
  return json(await getGoals());
});
