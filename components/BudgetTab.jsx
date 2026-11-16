"use client";

import { useState } from "react";
import { api, fmt } from "@/lib/api-client";
import BudgetBreakdown from "./BudgetBreakdown";
import { Button, Card, EmptyState, Field, IconButton, Input, PlusIcon, Select, Toggle, TrashIcon } from "./ui";

const FIXED_CATEGORIES = ["Logement", "Abonnements", "Transport", "Assurances", "Crédits", "Alimentation", "Autre"];
const SPENDING_CATEGORIES = ["Courses", "Restaurants", "Sorties", "Shopping", "Transport", "Santé", "Loisirs", "Autre"];

const dayFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const monthName = new Intl.DateTimeFormat("fr-FR", { month: "long" });

// "2026-11-16" → Date locale (sans décalage de fuseau)
const toDate = (day) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Date du jour au format "AAAA-MM-JJ" (heure locale de l'appareil)
const localToday = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export default function BudgetTab({ budget, onBudget, run }) {
  const { salary, expenses, computed, month } = budget;

  const update = async (action, message) => {
    const next = await run(action, message);
    if (next) onBudget(next);
    return next;
  };

  return (
    <>
      <BudgetHero salary={salary} computed={computed} month={month} />

      <Card title="Ajouter une dépense">
        <SpendingForm onAdd={(payload) => update(() => api.addTransaction(payload), "Dépense enregistrée")} />
      </Card>

      <Card
        title={`Dépenses de ${monthName.format(toDate(`${month.key}-01`))}`}
        action={<span className="text-sm font-semibold tabular-nums">{fmt(month.spent)}</span>}
      >
        {month.transactions.length === 0 ? (
          <EmptyState>Rien de dépensé ce mois-ci. Note tes achats au fur et à mesure.</EmptyState>
        ) : (
          <ul className="-my-1 divide-y divide-line">
            {month.transactions.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.label}</p>
                  <p className="text-xs text-muted">
                    {dayFormat.format(toDate(item.spent_on))} · {item.category}
                  </p>
                </div>
                <span className="font-semibold tabular-nums">{fmt(item.amount)}</span>
                <IconButton
                  label={`Supprimer ${item.label}`}
                  className="hover:text-danger"
                  onClick={() => update(() => api.deleteTransaction(item.id), "Dépense supprimée")}
                >
                  <TrashIcon />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Dépenses fixes"
        action={<span className="text-sm font-semibold tabular-nums">{fmt(computed.totalFixed)}</span>}
      >
        {expenses.length === 0 ? (
          <EmptyState>Aucune dépense fixe. Ajoute ton loyer, tes abonnements…</EmptyState>
        ) : (
          <ul className="-my-1 divide-y divide-line">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex items-center gap-3 py-2">
                <Toggle
                  checked={expense.active}
                  label={`${expense.active ? "Désactiver" : "Activer"} ${expense.label}`}
                  onChange={(active) => update(() => api.updateExpense(expense.id, { active }))}
                />
                <div className={`min-w-0 flex-1 ${expense.active ? "" : "opacity-50"}`}>
                  <p className="truncate font-medium">{expense.label}</p>
                  <p className="text-xs text-muted">{expense.category}</p>
                </div>
                <span className={`font-semibold tabular-nums ${expense.active ? "" : "line-through opacity-50"}`}>
                  {fmt(expense.amount)}
                </span>
                <IconButton
                  label={`Supprimer ${expense.label}`}
                  className="hover:text-danger"
                  onClick={() => update(() => api.deleteExpense(expense.id), "Dépense fixe supprimée")}
                >
                  <TrashIcon />
                </IconButton>
              </li>
            ))}
          </ul>
        )}

        <details className="group mt-3 border-t border-line pt-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-accent [&::-webkit-details-marker]:hidden">
            Ajouter une dépense fixe
            <span className="transition group-open:rotate-45" aria-hidden="true">
              <PlusIcon />
            </span>
          </summary>
          <div className="pt-2">
            <FixedExpenseForm onAdd={(payload) => update(() => api.addExpense(payload), "Dépense fixe ajoutée")} />
          </div>
        </details>
      </Card>
    </>
  );
}

function BudgetHero({ salary, computed, month }) {
  const { budgetSortie } = computed;
  const { spent, remaining } = month;
  const over = remaining < 0;
  const used = budgetSortie > 0 ? Math.min(100, (spent / budgetSortie) * 100) : spent > 0 ? 100 : 0;
  const gauge = over ? "bg-danger" : used >= 80 ? "bg-warn" : "bg-accent";

  return (
    <section className="rounded-2xl border border-line bg-gradient-to-b from-raised to-surface p-5">
      <p className="text-sm text-muted">Reste à dépenser ce mois-ci</p>
      <p className={`mt-1 text-4xl font-bold tracking-tight tabular-nums ${over ? "text-danger" : "text-accent"}`}>
        {fmt(remaining)}
      </p>
      <p className="mt-1 text-sm text-muted">
        {salary <= 0
          ? "Renseigne ton salaire dans Réglages pour démarrer."
          : `${fmt(spent)} dépensés sur ${fmt(budgetSortie)} de budget sorties`}
      </p>

      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label="Part du budget sorties déjà dépensée"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(used)}
      >
        <div className={`h-full rounded-full ${gauge}`} style={{ width: `${used}%` }} />
      </div>

      <p className="mt-5 mb-2 text-xs font-medium tracking-wide text-muted uppercase">
        Répartition du salaire{salary > 0 ? ` · ${fmt(salary)}` : ""}
      </p>
      <BudgetBreakdown salary={salary} {...computed} />
    </section>
  );
}

function AmountField({ value, onChange }) {
  return (
    <Field label="Montant (€)">
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0,00"
        required
      />
    </Field>
  );
}

function CategoryField({ value, onChange, options }) {
  return (
    <Field label="Catégorie">
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </Select>
    </Field>
  );
}

// Dépense réelle : un achat, daté (aujourd'hui par défaut)
function SpendingForm({ onAdd }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(SPENDING_CATEGORIES[0]);
  const [day, setDay] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    const added = await onAdd({ label, amount: Number(amount), category, spent_on: day || localToday() });
    setPending(false);
    if (added) {
      setLabel("");
      setAmount("");
      setDay("");
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <Field label="Quoi ?" className="col-span-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Courses, resto, essence…" required />
      </Field>
      <AmountField value={amount} onChange={setAmount} />
      <CategoryField value={category} onChange={setCategory} options={SPENDING_CATEGORIES} />
      <Field label="Date (aujourd'hui si vide)" className="col-span-2">
        <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
      </Field>
      <Button type="submit" className="col-span-2" disabled={pending}>
        <PlusIcon />
        Ajouter la dépense
      </Button>
    </form>
  );
}

// Dépense fixe : revient tous les mois (loyer, abonnements…)
function FixedExpenseForm({ onAdd }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(FIXED_CATEGORIES[0]);
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    const added = await onAdd({ label, amount: Number(amount), category });
    setPending(false);
    if (added) {
      setLabel("");
      setAmount("");
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <Field label="Libellé" className="col-span-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Loyer, Netflix…" required />
      </Field>
      <AmountField value={amount} onChange={setAmount} />
      <CategoryField value={category} onChange={setCategory} options={FIXED_CATEGORIES} />
      <Button type="submit" variant="secondary" className="col-span-2" disabled={pending}>
        <PlusIcon />
        Ajouter
      </Button>
    </form>
  );
}
