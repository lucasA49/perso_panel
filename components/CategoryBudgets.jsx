import { fmt } from "@/lib/api-client";
import { Card } from "./ui";

// Dépenses du mois par catégorie, avec une jauge quand un plafond est fixé
export default function CategoryBudgets({ categories }) {
  const visible = categories.filter((c) => c.limit > 0 || c.spent > 0);
  if (visible.length === 0) return null;
  const hasLimit = visible.some((c) => c.limit > 0);

  return (
    <Card title="Budgets par catégorie">
      <ul className="flex flex-col gap-4">
        {visible.map(({ name, limit, spent }) => {
          const ratio = limit > 0 ? spent / limit : 0;
          const over = limit > 0 && spent > limit;
          const tone = over ? "bg-danger" : ratio >= 0.8 ? "bg-warn" : "bg-accent";

          return (
            <li key={name}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{name}</span>
                <span className="text-sm tabular-nums">
                  <span className={`font-semibold ${over ? "text-danger" : ""}`}>{fmt(spent)}</span>
                  {limit > 0 && <span className="text-muted"> / {fmt(limit)}</span>}
                </span>
              </div>
              {limit > 0 && (
                <>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-line"
                    role="progressbar"
                    aria-label={`Budget ${name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(Math.min(1, ratio) * 100)}
                  >
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${tone}`}
                      style={{ width: `${Math.min(100, ratio * 100)}%` }}
                    />
                  </div>
                  <p className={`mt-1 text-xs ${over ? "text-danger" : "text-muted"}`}>
                    {over ? `Dépassé de ${fmt(spent - limit)}` : `Reste ${fmt(limit - spent)}`}
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {!hasLimit && (
        <p className="mt-4 text-sm text-muted">Fixe un plafond par catégorie dans Réglages pour afficher les jauges.</p>
      )}
    </Card>
  );
}
