// Logique de calcul du budget (serveur uniquement)
import "server-only";
import { query } from "./db";

const DEFAULTS = {
  salary: 0,
  savings: { mode: "percent", value: 10 }, // 10 % mis de côté par défaut
};

const round2 = (n) => Math.round(n * 100) / 100;

export async function getSetting(key, fallback) {
  const { rows } = await query("SELECT value FROM settings WHERE key = $1", [key]);
  return rows.length ? rows[0].value : fallback;
}

export async function setSetting(key, value) {
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, JSON.stringify(value)]
  );
}

// Renvoie l'état complet : réglages + dépenses + calcul du budget
export async function getFullState() {
  const salary = Number(await getSetting("salary", DEFAULTS.salary)) || 0;
  const savings = (await getSetting("savings", DEFAULTS.savings)) || DEFAULTS.savings;

  const { rows } = await query(
    "SELECT id, label, amount, category, active FROM fixed_expenses ORDER BY active DESC, amount DESC, id ASC"
  );
  const expenses = rows.map((e) => ({ ...e, amount: Number(e.amount) }));
  const totalFixed = expenses.filter((e) => e.active).reduce((sum, e) => sum + e.amount, 0);

  const rawSavings =
    savings.mode === "percent"
      ? (salary * Number(savings.value || 0)) / 100
      : Number(savings.value || 0);
  const savingsAmount = Math.max(0, round2(rawSavings));
  const budgetSortie = round2(salary - totalFixed - savingsAmount);

  return {
    salary,
    savings,
    expenses,
    computed: {
      totalFixed: round2(totalFixed),
      savingsAmount,
      budgetSortie,
      negative: budgetSortie < 0,
    },
  };
}
