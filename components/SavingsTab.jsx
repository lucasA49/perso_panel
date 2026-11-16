"use client";

import { useEffect, useRef, useState } from "react";
import { api, fmt } from "@/lib/api-client";
import { Button, Card, EmptyState, Field, IconButton, Input, PlusIcon, TrashIcon } from "./ui";

const QUICK_AMOUNTS = [10, 20, 50, 100];
const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const toDate = (day) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export default function SavingsTab({ monthlySavings, run }) {
  const [goals, setGoals] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getGoals().then(setGoals, (err) => setError(err.message));
  }, []);

  // Exécute une action qui renvoie la liste des objectifs à jour
  const update = async (action, message) => {
    const next = await run(action, message);
    if (next) setGoals(next);
    return next;
  };

  if (error) return <EmptyState>Impossible de charger l&apos;épargne : {error}</EmptyState>;
  if (!goals) return <div className="h-72 animate-pulse rounded-2xl bg-surface" aria-label="Chargement" />;

  return (
    <>
      {goals.length === 0 && (
        <EmptyState>
          Donne-toi un objectif (vacances, voiture, matelas de sécurité…) et regarde-le se remplir à chaque
          versement.
        </EmptyState>
      )}

      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} monthlySavings={monthlySavings} update={update} />
      ))}

      <Card title="Nouvel objectif">
        <GoalForm onAdd={(payload) => update(() => api.addGoal(payload), "Objectif créé")} />
      </Card>
    </>
  );
}

// Nombre qui défile jusqu'à sa nouvelle valeur
function useCountUp(value, duration = 900) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = origin + (value - origin) * eased;
      from.current = current;
      setShown(current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return shown;
}

// Anneau de progression animé : se remplit à l'ouverture, puis glisse à chaque versement
function ProgressRing({ ratio, reached, children }) {
  const size = 168;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const offset = length * (1 - Math.min(1, Math.max(0, ratio)));

  return (
    <div className="relative size-42">
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-line" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={`animate-ring-fill transition-[stroke-dashoffset,stroke] duration-1000 ease-out ${
            reached ? "stroke-warn" : "stroke-accent"
          }`}
          style={{ strokeDasharray: length, strokeDashoffset: offset, "--ring-length": length }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function GoalCard({ goal, monthlySavings, update }) {
  const { id, name, target, saved, remaining, reached, deposits } = goal;
  const [burst, setBurst] = useState(null);
  const [custom, setCustom] = useState("");
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const ratio = target > 0 ? saved / target : 0;
  const shownSaved = useCountUp(saved);
  const shownPercent = useCountUp(Math.min(100, ratio * 100));

  const deposit = async (amount) => {
    if (!(amount > 0)) return;
    setPending(true);
    const next = await update(() => api.addDeposit(id, amount));
    setPending(false);
    if (next) {
      setBurst((previous) => ({ key: (previous?.key ?? 0) + 1, amount }));
      setCustom("");
    }
  };

  const amounts = monthlySavings > 0 ? [...QUICK_AMOUNTS, monthlySavings] : QUICK_AMOUNTS;

  return (
    <section className="rounded-2xl border border-line bg-gradient-to-b from-raised to-surface p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{name}</h2>
          <p className="text-sm text-muted">Objectif : {fmt(target)}</p>
        </div>
        {reached && (
          <span className="animate-pop shrink-0 rounded-full bg-warn/15 px-2.5 py-1 text-xs font-semibold text-warn">
            Objectif atteint 🎉
          </span>
        )}
      </header>

      <div className="relative mt-4 flex justify-center">
        <ProgressRing ratio={ratio} reached={reached}>
          <span className="text-3xl font-bold tabular-nums">{Math.round(shownPercent)} %</span>
          <span className="text-sm text-muted tabular-nums">{fmt(shownSaved)}</span>
        </ProgressRing>
        {burst && (
          <span
            key={burst.key}
            onAnimationEnd={() => setBurst(null)}
            className="animate-float-up pointer-events-none absolute top-6 left-1/2 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-ink shadow-lg"
          >
            +{fmt(burst.amount)}
          </span>
        )}
      </div>

      <p className="mt-3 text-center text-sm text-muted" aria-live="polite">
        {reached ? (
          <>Bravo, tu as mis {fmt(saved)} de côté.</>
        ) : (
          <>
            Encore <span className="font-semibold text-ink">{fmt(remaining)}</span> pour y arriver
          </>
        )}
      </p>

      <p className="mt-5 mb-2 text-xs font-medium text-muted">Ajouter de l&apos;argent</p>
      <div className="flex flex-wrap gap-2">
        {amounts.map((amount, index) => (
          <button
            key={index}
            type="button"
            disabled={pending}
            onClick={() => deposit(amount)}
            className="min-h-11 cursor-pointer rounded-xl border border-line bg-raised px-3.5 text-sm font-semibold transition hover:border-accent hover:text-accent active:scale-95 disabled:opacity-50"
          >
            +{index >= QUICK_AMOUNTS.length ? `${fmt(amount)} (épargne du mois)` : `${amount} €`}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          deposit(Number(custom));
        }}
      >
        <Field label="Autre montant (€)" className="flex-1">
          <Input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="0,00"
            required
          />
        </Field>
        <Button type="submit" disabled={pending}>
          <PlusIcon />
          Ajouter
        </Button>
      </form>

      <details className="group mt-4 border-t border-line pt-1">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
          {deposits.length} versement{deposits.length > 1 ? "s" : ""}
          <span className="transition group-open:rotate-180" aria-hidden="true">
            ▾
          </span>
        </summary>

        <ul className="divide-y divide-line">
          {deposits.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-1 text-sm">
              <span className="flex-1 text-muted">{dayFormat.format(toDate(item.day))}</span>
              <span className="font-semibold tabular-nums text-accent">+{fmt(item.amount)}</span>
              <IconButton
                label={`Annuler le versement de ${fmt(item.amount)}`}
                className="hover:text-danger"
                onClick={() => update(() => api.deleteDeposit(item.id), "Versement annulé")}
              >
                <TrashIcon />
              </IconButton>
            </li>
          ))}
        </ul>

        <Button
          variant="danger"
          className="mt-2 w-full"
          onClick={() => (confirming ? update(() => api.deleteGoal(id), "Objectif supprimé") : setConfirming(true))}
          onBlur={() => setConfirming(false)}
        >
          <TrashIcon />
          {confirming ? "Confirmer : supprimer l'objectif et ses versements" : "Supprimer cet objectif"}
        </Button>
      </details>
    </section>
  );
}

function GoalForm({ onAdd }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    const added = await onAdd({ name, target: Number(target) });
    setPending(false);
    if (added) {
      setName("");
      setTarget("");
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <Field label="Pour quoi ?" className="col-span-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vacances, voiture…" required />
      </Field>
      <Field label="Montant à atteindre (€)" className="col-span-2">
        <Input
          type="number"
          inputMode="decimal"
          min="1"
          step="0.01"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="1 000"
          required
        />
      </Field>
      <Button type="submit" className="col-span-2" disabled={pending}>
        <PlusIcon />
        Créer l&apos;objectif
      </Button>
    </form>
  );
}
