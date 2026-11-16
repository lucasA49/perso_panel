// Logique de calcul du budget (serveur uniquement)
import "server-only";
import { currentMonth } from "./dates";
import { query } from "./db";

const DEFAULTS = {
  salary: 0,
  savings: { mode: "percent", value: 10 }, // 10 % mis de côté par défaut
};

export const round2 = (n) => Math.round(n * 100) / 100;

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

// Renvoie l'état complet : réglages + dépenses fixes + calcul du budget + dépenses réelles du mois
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

  // Dépenses réelles du mois en cours
  const monthKey = currentMonth();
  const { rows: spending } = await query(
    `SELECT id, label, amount, category, to_char(spent_on, 'YYYY-MM-DD') AS spent_on
     FROM transactions WHERE to_char(spent_on, 'YYYY-MM') = $1
     ORDER BY spent_on DESC, id DESC`,
    [monthKey]
  );
  const transactions = spending.map((t) => ({ ...t, amount: Number(t.amount) }));
  const spent = round2(transactions.reduce((sum, t) => sum + t.amount, 0));

  return {
    salary,
    savings,
    expenses,
    month: { key: monthKey, spent, remaining: round2(budgetSortie - spent), transactions },
    computed: {
      totalFixed: round2(totalFixed),
      savingsAmount,
      budgetSortie,
      negative: budgetSortie < 0,
    },
  };
}
