// Logique de calcul du budget (serveur uniquement)
import "server-only";
import { SPENDING_CATEGORIES } from "./categories";
import { currentMonth } from "./dates";
import { query } from "./db";

const DEFAULTS = {
  salary: 0,
  savings: { mode: "percent", value: 10 }, // 10 % mis de côté par défaut
};

export const round2 = (n) => Math.round(n * 100) / 100;
export const sum = (items) => round2(items.reduce((total, item) => total + item.amount, 0));

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

// Calcul central : revenus (salaire + autres revenus du mois) − dépenses fixes − épargne = budget sorties.
// L'épargne en pourcentage s'applique au total des revenus.
export function computeBudget({ salary, extraIncome = 0, totalFixed, savings }) {
  const totalIncome = round2(salary + extraIncome);
  const rawSavings =
    savings.mode === "percent" ? (totalIncome * Number(savings.value || 0)) / 100 : Number(savings.value || 0);
  const savingsAmount = Math.max(0, round2(rawSavings));
  const budgetSortie = round2(totalIncome - totalFixed - savingsAmount);

  return {
    totalIncome,
    extraIncome: round2(extraIncome),
    totalFixed: round2(totalFixed),
    savingsAmount,
    budgetSortie,
    negative: budgetSortie < 0,
  };
}

// Lignes datées (dépenses réelles ou revenus), montants convertis en nombres
export const DATED_TABLES = {
  transactions: { day: "spent_on", columns: "id, label, amount, category" },
  incomes: { day: "received_on", columns: "id, source, amount" },
};

export async function getDated(table, month) {
  const { day, columns } = DATED_TABLES[table];
  const { rows } = await query(
    `SELECT ${columns}, to_char(${day}, 'YYYY-MM-DD') AS day FROM ${table}
     ${month ? `WHERE to_char(${day}, 'YYYY-MM') = $1` : ""}
     ORDER BY ${day} DESC, id DESC`,
    month ? [month] : []
  );
  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
}

// Renvoie l'état complet : réglages + dépenses fixes + revenus et dépenses réelles du mois + calcul du budget
export async function getFullState() {
  const salary = Number(await getSetting("salary", DEFAULTS.salary)) || 0;
  const savings = (await getSetting("savings", DEFAULTS.savings)) || DEFAULTS.savings;

  const { rows } = await query(
    "SELECT id, label, amount, category, active FROM fixed_expenses ORDER BY active DESC, amount DESC, id ASC"
  );
  const expenses = rows.map((e) => ({ ...e, amount: Number(e.amount) }));
  const totalFixed = sum(expenses.filter((e) => e.active));

  const monthKey = currentMonth();
  const incomes = await getDated("incomes", monthKey);
  const transactions = await getDated("transactions", monthKey);

  // Dépenses du mois par catégorie, face au plafond éventuel (0 = pas de plafond)
  const limits = (await getSetting("category_budgets", {})) || {};
  const names = [...new Set([...SPENDING_CATEGORIES, ...transactions.map((t) => t.category)])];
  const categories = names.map((name) => ({
    name,
    limit: Number(limits[name]) || 0,
    spent: sum(transactions.filter((t) => t.category === name)),
  }));

  const computed = computeBudget({ salary, extraIncome: sum(incomes), totalFixed, savings });
  const spent = sum(transactions);

  return {
    salary,
    savings,
    expenses,
    categories,
    month: { key: monthKey, incomes, transactions, spent, remaining: round2(computed.budgetSortie - spent) },
    computed,
  };
}
