// Logique de calcul du budget
import { query } from './db/pool.js';

const DEFAULTS = {
  salary: 0,
  savings: { mode: 'percent', value: 10 }, // 10% mis de côté par défaut
};

export async function getSetting(key, fallback) {
  const { rows } = await query('SELECT value FROM settings WHERE key = $1', [key]);
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
  const salary = Number(await getSetting('salary', DEFAULTS.salary)) || 0;
  const savings = (await getSetting('savings', DEFAULTS.savings)) || DEFAULTS.savings;

  const { rows: expenses } = await query(
    'SELECT id, label, amount, category, active FROM fixed_expenses ORDER BY active DESC, amount DESC, id ASC'
  );

  const normalized = expenses.map((e) => ({ ...e, amount: Number(e.amount) }));
  const activeExpenses = normalized.filter((e) => e.active);
  const totalFixed = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  let savingsAmount = 0;
  if (savings.mode === 'percent') {
    savingsAmount = (salary * Number(savings.value || 0)) / 100;
  } else {
    savingsAmount = Number(savings.value || 0);
  }
  savingsAmount = Math.max(0, Math.round(savingsAmount * 100) / 100);

  const budgetSortie = Math.round((salary - totalFixed - savingsAmount) * 100) / 100;

  return {
    salary,
    savings,
    expenses: normalized,
    computed: {
      totalFixed: Math.round(totalFixed * 100) / 100,
      savingsAmount,
      budgetSortie,
      negative: budgetSortie < 0,
    },
  };
}
