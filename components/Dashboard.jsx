"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import BudgetTab from "./BudgetTab";
import RemindersTab from "./RemindersTab";
import SettingsTab from "./SettingsTab";
import { BellIcon, Button, SlidersIcon, WalletIcon } from "./ui";

const TABS = [
  { id: "budget", label: "Budget", Icon: WalletIcon },
  { id: "reminders", label: "Rappels", Icon: BellIcon },
  { id: "settings", label: "Réglages", Icon: SlidersIcon },
];

const fetchAll = () => Promise.all([api.getState(), api.getReminders()]);

export default function Dashboard() {
  const [tab, setTab] = useState("budget");
  const [budget, setBudget] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(
    () =>
      fetchAll().then(
        ([state, list]) => {
          setBudget(state);
          setReminders(list);
          setLoadError(null);
        },
        (err) => setLoadError(err.message)
      ),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  // Le message disparaît tout seul
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message, kind = "ok") => setToast({ message, kind }), []);

  // Exécute une action API et affiche l'erreur éventuelle
  const run = useCallback(
    async (action, successMessage) => {
      try {
        const result = await action();
        if (successMessage) notify(successMessage);
        return result;
      } catch (err) {
        notify(err.message, "error");
        return undefined;
      }
    },
    [notify]
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-[calc(env(safe-area-inset-bottom)+6rem)]">
      <header className="mb-5">
        <p className="text-xs font-medium tracking-widest text-muted uppercase">Perso Panel</p>
        <h1 className="text-2xl font-bold">{TABS.find((t) => t.id === tab).label}</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4">
        {loadError ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4">
            <p className="font-semibold text-danger">Impossible de charger les données</p>
            <p className="mt-1 text-sm text-muted">{loadError}</p>
            <Button variant="secondary" className="mt-3" onClick={load}>
              Réessayer
            </Button>
          </div>
        ) : !budget ? (
          <Skeleton />
        ) : tab === "budget" ? (
          <BudgetTab budget={budget} onBudget={setBudget} run={run} />
        ) : tab === "reminders" ? (
          <RemindersTab reminders={reminders} onReminders={setReminders} run={run} />
        ) : (
          <SettingsTab budget={budget} onBudget={setBudget} run={run} notify={notify} />
        )}
      </main>

      {toast && (
        <div
          role="status"
          className={`fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-20 mx-auto max-w-md rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            toast.kind === "error"
              ? "border-danger/40 bg-[#2a1517] text-danger"
              : "border-accent/40 bg-[#10241c] text-accent"
          }`}
        >
          {toast.message}
        </div>
      )}

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex max-w-md">
          {TABS.map(({ id, label, Icon }) => (
            <li key={id} className="flex-1">
              <button
                type="button"
                aria-current={tab === id ? "page" : undefined}
                onClick={() => setTab(id)}
                className={`flex h-16 w-full cursor-pointer flex-col items-center justify-center gap-1 text-xs font-medium transition ${
                  tab === id ? "text-accent" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="size-6" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-label="Chargement">
      <div className="h-44 rounded-2xl bg-surface" />
      <div className="h-24 rounded-2xl bg-surface" />
      <div className="h-56 rounded-2xl bg-surface" />
    </div>
  );
}
