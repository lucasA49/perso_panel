import { fmt } from "@/lib/api-client";

// Répartition des revenus : barre empilée + légende (dépenses fixes / épargne / sorties)
export default function BudgetBreakdown({ totalIncome, totalFixed, savingsAmount, budgetSortie }) {
  const share = (n) => (totalIncome > 0 ? Math.min(100, Math.max(0, (n / totalIncome) * 100)) : 0);

  const parts = [
    { label: "Dépenses fixes", value: totalFixed, color: "bg-warn" },
    { label: "Épargne", value: savingsAmount, color: "bg-info" },
    { label: "Sorties", value: Math.max(0, budgetSortie), color: "bg-accent" },
  ];

  return (
    <>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        {parts.map((part) => (
          <div key={part.label} className={part.color} style={{ width: `${share(part.value)}%` }} />
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {parts.map((part) => (
          <div key={part.label}>
            <dt className="flex items-center gap-1.5 text-xs text-muted">
              <span className={`size-2 shrink-0 rounded-full ${part.color}`} />
              {part.label}
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{fmt(part.value)}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
