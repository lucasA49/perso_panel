"use client";

import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api-client";
import BudgetBreakdown from "./BudgetBreakdown";
import { Card, EmptyState } from "./ui";

const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const shortMonthFormat = new Intl.DateTimeFormat("fr-FR", { month: "short" });

// "2026-11" → Date au 1er du mois
const toDate = (month) => {
  const [year, index] = month.split("-").map(Number);
  return new Date(year, index - 1, 1);
};
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export default function HistoryTab() {
  const [months, setMonths] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getHistory().then(setMonths, (err) => setError(err.message));
  }, []);

  if (error) return <EmptyState>Impossible de charger l&apos;historique : {error}</EmptyState>;
  if (!months) return <div className="h-56 animate-pulse rounded-2xl bg-surface" aria-label="Chargement" />;

  return (
    <>
      {months.length > 1 && <TrendCard months={months} />}

      {months.map((entry) => (
        <MonthCard key={entry.month} entry={entry} />
      ))}

      {months.length <= 1 && (
        <EmptyState>
          L&apos;historique se remplit tout seul : chaque mois est enregistré automatiquement, et les mois passés
          restent figés tels qu&apos;ils étaient.
        </EmptyState>
      )}
    </>
  );
}

// Évolution du budget sorties sur les 6 derniers mois
function TrendCard({ months }) {
  const recent = months.slice(0, 6).reverse();
  const max = Math.max(1, ...recent.map((m) => Math.max(0, m.budgetSortie)));

  return (
    <Card title="Budget sorties par mois">
      <ol className="flex h-36 items-end gap-2">
        {recent.map((m) => (
          <li key={m.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[11px] font-semibold tabular-nums">{Math.round(m.budgetSortie)} €</span>
            <div
              className={`w-full rounded-t-md ${m.budgetSortie < 0 ? "bg-danger" : m.current ? "bg-accent" : "bg-accent/45"}`}
              style={{ height: `${Math.max(3, (Math.max(0, m.budgetSortie) / max) * 70)}%` }}
            />
            <span className="text-xs text-muted">{shortMonthFormat.format(toDate(m.month))}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function MonthCard({ entry }) {
  const { month, current, salary, budgetSortie, expenses } = entry;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{capitalize(monthFormat.format(toDate(month)))}</h2>
          <p className="text-xs text-muted">Salaire : {fmt(salary)}</p>
        </div>
        {current && (
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">En cours</span>
        )}
      </header>

      <p className={`mt-3 text-2xl font-bold tabular-nums ${budgetSortie < 0 ? "text-danger" : "text-accent"}`}>
        {fmt(budgetSortie)}
        <span className="ml-2 text-sm font-normal text-muted">de budget sorties</span>
      </p>

      <div className="mt-3">
        <BudgetBreakdown {...entry} />
      </div>

      {expenses.length > 0 && (
        <details className="group mt-3 border-t border-line pt-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
            {expenses.length} dépense{expenses.length > 1 ? "s" : ""} fixe{expenses.length > 1 ? "s" : ""}
            <span className="transition group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </summary>
          <ul className="divide-y divide-line">
            {expenses.map((expense, index) => (
              <li key={index} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{expense.label}</span>
                  <span className="text-xs text-muted">{expense.category}</span>
                </span>
                <span className="font-semibold tabular-nums">{fmt(expense.amount)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
