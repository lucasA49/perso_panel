// Objectifs d'épargne et versements (serveur uniquement)
import "server-only";
import { round2, sum } from "./budget";
import { query } from "./db";

// Tous les objectifs avec leur total épargné et leurs versements (du plus récent au plus ancien)
export async function getGoals() {
  const { rows: goals } = await query("SELECT id, name, target FROM savings_goals ORDER BY id ASC");
  const { rows: deposits } = await query(
    `SELECT id, goal_id, amount, to_char(day, 'YYYY-MM-DD') AS day
     FROM savings_deposits ORDER BY day DESC, id DESC`
  );

  return goals.map((goal) => {
    const own = deposits
      .filter((d) => d.goal_id === goal.id)
      .map(({ id, amount, day }) => ({ id, amount: Number(amount), day }));
    const target = Number(goal.target);
    const saved = sum(own);

    return {
      id: goal.id,
      name: goal.name,
      target,
      saved,
      remaining: Math.max(0, round2(target - saved)),
      reached: saved >= target,
      deposits: own,
    };
  });
}
