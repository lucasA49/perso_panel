"use client";

import { useState } from "react";
import { api, fmt } from "@/lib/api-client";
import BudgetBreakdown from "./BudgetBreakdown";
import { Button, Card, EmptyState, Field, IconButton, Input, PlusIcon, Select, Toggle, TrashIcon } from "./ui";

const CATEGORIES = ["Logement", "Abonnements", "Transport", "Assurances", "Crédits", "Alimentation", "Autre"];

export default function BudgetTab({ budget, onBudget, run }) {
  const { salary, expenses, computed } = budget;

  const update = async (action, message) => {
    const next = await run(action, message);
    if (next) onBudget(next);
    return next;
  };

  return (
    <>
      <BudgetHero salary={salary} computed={computed} />

      <Card title="Ajouter une dépense fixe">
        <ExpenseForm onAdd={(payload) => update(() => api.addExpense(payload), "Dépense ajoutée")} />
      </Card>

      <Card
        title="Dépenses fixes"
        action={<span className="text-sm font-semibold tabular-nums">{fmt(computed.totalFixed)}</span>}
      >
        {expenses.length === 0 ? (
          <EmptyState>Aucune dépense pour l&apos;instant. Ajoute ton loyer, tes abonnements…</EmptyState>
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
                  onClick={() => update(() => api.deleteExpense(expense.id), "Dépense supprimée")}
                >
                  <TrashIcon />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function BudgetHero({ salary, computed }) {
  const { budgetSortie, negative } = computed;

  return (
    <section className="rounded-2xl border border-line bg-gradient-to-b from-raised to-surface p-5">
      <p className="text-sm text-muted">Budget sorties ce mois-ci</p>
      <p className={`mt-1 text-4xl font-bold tracking-tight tabular-nums ${negative ? "text-danger" : "text-accent"}`}>
        {fmt(budgetSortie)}
      </p>
      <p className="mt-1 mb-4 text-sm text-muted">
        {salary <= 0
          ? "Renseigne ton salaire dans Réglages pour démarrer."
          : negative
            ? "Tes dépenses et ton épargne dépassent ton salaire."
            : `sur un salaire de ${fmt(salary)}`}
      </p>
      <BudgetBreakdown salary={salary} {...computed} />
    </section>
  );
}

function ExpenseForm({ onAdd }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
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
      <Field label="Montant (€)">
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          required
        />
      </Field>
      <Field label="Catégorie">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Button type="submit" className="col-span-2" disabled={pending}>
        <PlusIcon />
        Ajouter
      </Button>
    </form>
  );
}
