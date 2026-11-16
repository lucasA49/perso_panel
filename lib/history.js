// Historique mensuel : une photo du budget par mois (serveur uniquement).
// Le mois en cours est mis à jour à chaque modification ; les mois passés restent figés.
import "server-only";
import { getFullState, round2 } from "./budget";
import { currentMonth } from "./dates";
import { query } from "./db";

async function saveSnapshot(state, { overwrite }) {
  const { salary, expenses, computed } = state;
  const active = expenses
    .filter((e) => e.active)
    .map(({ label, amount, category }) => ({ label, amount, category }));

  await query(
    `INSERT INTO monthly_snapshots (month, salary, total_fixed, savings_amount, budget_sortie, expenses)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (month) DO ${
       overwrite
         ? `UPDATE SET salary = EXCLUDED.salary, total_fixed = EXCLUDED.total_fixed,
              savings_amount = EXCLUDED.savings_amount, budget_sortie = EXCLUDED.budget_sortie,
              expenses = EXCLUDED.expenses, updated_at = now()`
         : "NOTHING"
     }`,
    [currentMonth(), salary, computed.totalFixed, computed.savingsAmount, computed.budgetSortie, JSON.stringify(active)]
  );
}

// À appeler après chaque modification du budget : renvoie l'état à jour et l'enregistre dans le mois en cours
export async function commitState() {
  const state = await getFullState();
  await saveSnapshot(state, { overwrite: true });
  return state;
}

// Crée la photo du mois en cours si elle n'existe pas encore (changement de mois sans modification)
export async function ensureCurrentSnapshot() {
  const { rows } = await query("SELECT 1 FROM monthly_snapshots WHERE month = $1", [currentMonth()]);
  if (!rows.length) await saveSnapshot(await getFullState(), { overwrite: false });
}

// Tous les mois, du plus récent au plus ancien, avec les dépenses réelles de chacun
export async function getHistory() {
  await ensureCurrentSnapshot();
  const { rows } = await query(
    `SELECT month, salary, total_fixed, savings_amount, budget_sortie, expenses
     FROM monthly_snapshots ORDER BY month DESC`
  );
  const { rows: spending } = await query(
    `SELECT id, label, amount, category, to_char(spent_on, 'YYYY-MM-DD') AS spent_on
     FROM transactions ORDER BY spent_on DESC, id DESC`
  );

  const now = currentMonth();
  return rows.map((row) => {
    const transactions = spending
      .filter((t) => t.spent_on.startsWith(row.month))
      .map((t) => ({ ...t, amount: Number(t.amount) }));
    const spent = round2(transactions.reduce((sum, t) => sum + t.amount, 0));
    const budgetSortie = Number(row.budget_sortie);

    return {
      month: row.month,
      current: row.month === now,
      salary: Number(row.salary),
      totalFixed: Number(row.total_fixed),
      savingsAmount: Number(row.savings_amount),
      budgetSortie,
      expenses: row.expenses,
      spent,
      remaining: round2(budgetSortie - spent),
      transactions,
    };
  });
}
