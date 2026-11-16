import { setSetting } from "@/lib/budget";
import { SPENDING_CATEGORIES } from "@/lib/categories";
import { commitState } from "@/lib/history";
import { badRequest, handle, json, readBody } from "@/lib/http";

// Réglages : salaire, épargne, plafonds par catégorie
export const PUT = handle(async (request) => {
  const { salary, savings, categoryBudgets } = await readBody(request);

  if (salary !== undefined) {
    const n = Number(salary);
    if (Number.isNaN(n) || n < 0) return badRequest("Salaire invalide");
    await setSetting("salary", n);
  }
  if (savings !== undefined && savings !== null) {
    const mode = savings.mode === "amount" ? "amount" : "percent";
    const value = Math.max(0, Number(savings.value) || 0);
    await setSetting("savings", { mode, value });
  }
  if (categoryBudgets !== undefined && categoryBudgets !== null) {
    // Plafonds par catégorie : on ne garde que les catégories connues avec un montant > 0
    const limits = {};
    for (const name of SPENDING_CATEGORIES) {
      const value = Number(categoryBudgets[name]);
      if (value > 0) limits[name] = Math.round(value * 100) / 100;
    }
    await setSetting("category_budgets", limits);
  }
  return json(await commitState());
});
