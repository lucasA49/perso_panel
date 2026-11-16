"use client";

import { useEffect, useState } from "react";
import { api, fmt } from "@/lib/api-client";
import BudgetBreakdown from "./BudgetBreakdown";
import { Card, EmptyState } from "./ui";

const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const shortMonthFormat = new Intl.DateTimeFormat("fr-FR", { month: "short" });

// "2026-11" → Date au 1er du mois
const toDate = (month) => {
  const [year, index] = month.split("-").map(Number);
  return new Date(year, index - 1, 1);
};
// "2026-11-16" → Date locale
const toDay = (day) => {
  const [year, index, date] = day.split("-").map(Number);
  return new Date(year, index - 1, date);
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

// Dépensé par rapport au budget sorties, sur les 6 derniers mois
function TrendCard({ months }) {
  const recent = months.slice(0, 6).reverse();
  const max = Math.max(1, ...recent.flatMap((m) => [m.budgetSortie, m.spent]));
  const height = (value) => `${Math.max(2, (Math.max(0, value) / max) * 100)}%`;

  return (
    <Card title="Dépensé / budget sorties">
      <ol className="flex h-40 items-end gap-3">
        {recent.map((m) => (
          <li key={m.month} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1">
            <span className={`text-[11px] font-semibold tabular-nums ${m.remaining < 0 ? "text-danger" : ""}`}>
              {Math.round(m.spent)} €
            </span>
            <div className="flex w-full flex-1 items-end gap-1">
              <div className="flex-1 rounded-t-md bg-line" style={{ height: height(m.budgetSortie) }} />
              <div
                className={`flex-1 rounded-t-md ${m.remaining < 0 ? "bg-danger" : "bg-accent"}`}
                style={{ height: height(m.spent) }}
              />
            </div>
            <span className="text-xs text-muted">{shortMonthFormat.format(toDate(m.month))}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-line" /> Budget sorties
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent" /> Dépensé
        </span>
      </p>
    </Card>
  );
}

function MonthCard({ entry }) {
  const { month, current, salary, totalIncome, budgetSortie, expenses, incomes, spent, remaining, transactions } = entry;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{capitalize(monthFormat.format(toDate(month)))}</h2>
          <p className="text-xs text-muted">Revenus : {fmt(totalIncome)}</p>
        </div>
        {current && (
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">En cours</span>
        )}
      </header>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        <Figure label="Budget sorties" value={budgetSortie} tone={budgetSortie < 0 ? "text-danger" : ""} />
        <Figure label="Dépensé" value={spent} />
        <Figure label="Reste" value={remaining} tone={remaining < 0 ? "text-danger" : "text-accent"} />
      </dl>

      <div className="mt-4">
        <BudgetBreakdown {...entry} />
      </div>

      <Details
        title={`${incomes.length + 1} revenu${incomes.length > 0 ? "s" : ""}`}
        items={[
          { key: "salary", label: "Salaire", detail: "Chaque mois", amount: salary },
          ...incomes.map((i) => ({ key: i.id, label: i.source, detail: dayFormat.format(toDay(i.day)), amount: i.amount })),
        ]}
      />
      <Details
        title={`${transactions.length} dépense${transactions.length > 1 ? "s" : ""} du mois`}
        items={transactions.map((t) => ({
          key: t.id,
          label: t.label,
          detail: `${dayFormat.format(toDay(t.day))} · ${t.category}`,
          amount: t.amount,
        }))}
      />
      <Details
        title={`${expenses.length} dépense${expenses.length > 1 ? "s" : ""} fixe${expenses.length > 1 ? "s" : ""}`}
        items={expenses.map((e, index) => ({ key: index, label: e.label, detail: e.category, amount: e.amount }))}
      />
    </section>
  );
}

function Figure({ label, value, tone = "" }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 text-lg font-bold tabular-nums ${tone}`}>{fmt(value)}</dd>
    </div>
  );
}

// Liste dépliable (masquée s'il n'y a rien à montrer)
function Details({ title, items }) {
  if (items.length === 0) return null;

  return (
    <details className="group mt-3 border-t border-line pt-1">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <span className="transition group-open:rotate-180" aria-hidden="true">
          ▾
        </span>
      </summary>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="min-w-0">
              <span className="block truncate">{item.label}</span>
              <span className="text-xs text-muted">{item.detail}</span>
            </span>
            <span className="font-semibold tabular-nums">{fmt(item.amount)}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
