// Historique mensuel : une photo du budget par mois (serveur uniquement).
// Le mois en cours est mis à jour à chaque modification ; les mois passés gardent leur salaire,
// leurs dépenses fixes et leur réglage d'épargne. Revenus et dépenses datés sont relus en direct.
import "server-only";
import { computeBudget, getDated, getFullState, round2, sum } from "./budget";
import { currentMonth } from "./dates";
import { query } from "./db";

async function saveSnapshot(state, { overwrite }) {
  const { salary, savings, expenses, computed } = state;
  const active = expenses
    .filter((e) => e.active)
    .map(({ label, amount, category }) => ({ label, amount, category }));

  await query(
    `INSERT INTO monthly_snapshots (month, salary, total_fixed, savings_amount, budget_sortie, expenses, savings)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (month) DO ${
       overwrite
         ? `UPDATE SET salary = EXCLUDED.salary, total_fixed = EXCLUDED.total_fixed,
              savings_amount = EXCLUDED.savings_amount, budget_sortie = EXCLUDED.budget_sortie,
              expenses = EXCLUDED.expenses, savings = EXCLUDED.savings, updated_at = now()`
         : "NOTHING"
     }`,
    [
      currentMonth(),
      salary,
      computed.totalFixed,
      computed.savingsAmount,
      computed.budgetSortie,
      JSON.stringify(active),
      JSON.stringify(savings),
    ]
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

// Premier mois de l'historique ("AAAA-MM") : aucune ligne datée ne peut être antérieure
export async function firstMonth() {
  await ensureCurrentSnapshot();
  const { rows } = await query("SELECT min(month) AS first FROM monthly_snapshots");
  return rows[0].first;
}

// Tous les mois, du plus récent au plus ancien, avec leurs revenus et dépenses réelles
export async function getHistory() {
  await ensureCurrentSnapshot();
  const { rows } = await query(
    `SELECT month, salary, total_fixed, savings_amount, expenses, savings
     FROM monthly_snapshots ORDER BY month DESC`
  );
  const allIncomes = await getDated("incomes");
  const allTransactions = await getDated("transactions");

  const now = currentMonth();
  return rows.map((row) => {
    const incomes = allIncomes.filter((i) => i.day.startsWith(row.month));
    const transactions = allTransactions.filter((t) => t.day.startsWith(row.month));
    const salary = Number(row.salary);
    const computed = computeBudget({
      salary,
      extraIncome: sum(incomes),
      totalFixed: Number(row.total_fixed),
      // Anciennes lignes sans réglage d'épargne : on garde le montant enregistré
      savings: row.savings ?? { mode: "amount", value: Number(row.savings_amount) },
    });
    const spent = sum(transactions);

    return {
      month: row.month,
      current: row.month === now,
      salary,
      ...computed,
      expenses: row.expenses,
      incomes,
      transactions,
      spent,
      remaining: round2(computed.budgetSortie - spent),
    };
  });
}
