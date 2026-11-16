import { getFullState } from "@/lib/budget";
import { query } from "@/lib/db";
import { badRequest, handle, json, readBody, readId } from "@/lib/http";

// Modifie une dépense fixe (libellé, montant, catégorie, active)
export const PATCH = handle(async (request, context) => {
  const id = await readId(context);
  if (!id) return badRequest("Identifiant invalide");

  const { label, amount, category, active } = await readBody(request);
  const fields = [];
  const values = [];
  const set = (column, value) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (label !== undefined) {
    if (!String(label).trim()) return badRequest("Libellé requis");
    set("label", String(label).trim());
  }
  if (amount !== undefined) {
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) return badRequest("Montant invalide");
    set("amount", amt);
  }
  if (category !== undefined) set("category", String(category).trim() || "Autre");
  if (active !== undefined) set("active", Boolean(active));

  if (!fields.length) return badRequest("Rien à modifier");
  values.push(id);
  await query(`UPDATE fixed_expenses SET ${fields.join(", ")} WHERE id = $${values.length}`, values);
  return json(await getFullState());
});

export const DELETE = handle(async (request, context) => {
  const id = await readId(context);
  if (!id) return badRequest("Identifiant invalide");
  await query("DELETE FROM fixed_expenses WHERE id = $1", [id]);
  return json(await getFullState());
});
