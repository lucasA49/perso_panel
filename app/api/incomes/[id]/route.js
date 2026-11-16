import { query } from "@/lib/db";
import { commitState } from "@/lib/history";
import { badRequest, handle, json, readId } from "@/lib/http";

export const DELETE = handle(async (request, context) => {
  const id = await readId(context);
  if (!id) return badRequest("Identifiant invalide");
  await query("DELETE FROM incomes WHERE id = $1", [id]);
  return json(await commitState());
});
