"use client";

import { useState } from "react";
import { api, fmt } from "@/lib/api-client";
import { SPENDING_CATEGORIES } from "@/lib/categories";
import { enablePush } from "@/lib/push-client";
import { Button, Card, Field, Input, Segmented } from "./ui";

const SAVINGS_MODES = [
  { value: "percent", label: "% des revenus" },
  { value: "amount", label: "Montant fixe" },
];

export default function SettingsTab({ budget, onBudget, run, notify }) {
  return (
    <>
      <IncomeCard budget={budget} onBudget={onBudget} run={run} />
      <CategoryLimitsCard budget={budget} onBudget={onBudget} run={run} />
      <NotificationsCard run={run} notify={notify} />
      <Card title="Sauvegarde">
        <p className="mb-3 text-sm text-muted">
          Télécharge toutes tes données (réglages, dépenses, rappels) dans un fichier JSON.
        </p>
        <a
          href="/api/export"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-raised px-4 text-sm font-semibold transition hover:border-muted"
        >
          Exporter mes données
        </a>
      </Card>
    </>
  );
}

function IncomeCard({ budget, onBudget, run }) {
  const [salary, setSalary] = useState(String(budget.salary || ""));
  const [mode, setMode] = useState(budget.savings.mode);
  const [value, setValue] = useState(String(budget.savings.value ?? ""));
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    const next = await run(
      () => api.saveSettings({ salary: Number(salary) || 0, savings: { mode, value: Number(value) || 0 } }),
      "Réglages enregistrés"
    );
    setPending(false);
    if (next) onBudget(next);
  };

  return (
    <Card title="Revenus et épargne">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Salaire mensuel net (€)">
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="0,00"
          />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Épargne mise de côté</span>
          <Segmented label="Mode d'épargne" value={mode} onChange={setMode} options={SAVINGS_MODES} />
        </div>
        <Field label={mode === "percent" ? "Pourcentage (%)" : "Montant (€)"}>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            max={mode === "percent" ? "100" : undefined}
            step={mode === "percent" ? "1" : "0.01"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
        <p className="text-sm text-muted">
          Épargne actuelle : <span className="font-semibold text-ink">{fmt(budget.computed.savingsAmount)}</span> par mois
        </p>
        <Button type="submit" disabled={pending}>
          Enregistrer
        </Button>
      </form>
    </Card>
  );
}

// Plafond mensuel par catégorie de dépenses (vide = pas de plafond)
function CategoryLimitsCard({ budget, onBudget, run }) {
  const [limits, setLimits] = useState(() =>
    Object.fromEntries(budget.categories.map((c) => [c.name, c.limit > 0 ? String(c.limit) : ""]))
  );
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    const categoryBudgets = Object.fromEntries(Object.entries(limits).map(([name, value]) => [name, Number(value) || 0]));
    const next = await run(() => api.saveSettings({ categoryBudgets }), "Plafonds enregistrés");
    setPending(false);
    if (next) onBudget(next);
  };

  return (
    <Card title="Budgets par catégorie">
      <p className="mb-3 text-sm text-muted">
        Plafond mensuel par catégorie de dépenses. Laisse vide pour ne pas en mettre.
      </p>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        {SPENDING_CATEGORIES.map((name) => (
          <Field key={name} label={`${name} (€)`}>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={limits[name] ?? ""}
              onChange={(e) => setLimits({ ...limits, [name]: e.target.value })}
              placeholder="—"
            />
          </Field>
        ))}
        <Button type="submit" className="col-span-2" disabled={pending}>
          Enregistrer les plafonds
        </Button>
      </form>
    </Card>
  );
}

function NotificationsCard({ run, notify }) {
  const [pending, setPending] = useState(false);

  const enable = async () => {
    setPending(true);
    await run(enablePush, "Notifications activées sur cet appareil");
    setPending(false);
  };

  const test = async () => {
    setPending(true);
    const result = await run(api.testPush);
    setPending(false);
    if (!result) return;
    if (result.sent > 0) notify(`Notification envoyée à ${result.sent} appareil(s)`);
    else notify("Aucun appareil abonné : active d'abord les notifications.", "error");
  };

  return (
    <Card title="Notifications">
      <p className="mb-3 text-sm text-muted">
        Reçois tes rappels sur cet appareil. Sur iPhone, ajoute d&apos;abord l&apos;app à l&apos;écran d&apos;accueil.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={enable} disabled={pending}>
          Activer
        </Button>
        <Button variant="secondary" onClick={test} disabled={pending}>
          Tester
        </Button>
      </div>
    </Card>
  );
}
