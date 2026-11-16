"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { RECURRENCES, RECURRENCE_LABELS } from "@/lib/reminders";
import { Button, Card, EmptyState, Field, IconButton, Input, PlusIcon, Select, Toggle, TrashIcon } from "./ui";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const byDate = (a, b) => new Date(a.remind_at) - new Date(b.remind_at);

export default function RemindersTab({ reminders, onReminders, run }) {
  const add = async (payload) => {
    const created = await run(() => api.addReminder(payload), "Rappel ajouté");
    if (created) onReminders([...reminders, created].sort(byDate));
    return created;
  };

  const toggle = async (reminder, enabled) => {
    const updated = await run(() => api.updateReminder(reminder.id, { enabled }));
    if (updated) onReminders(reminders.map((r) => (r.id === updated.id ? updated : r)));
  };

  const remove = async (reminder) => {
    const done = await run(() => api.deleteReminder(reminder.id), "Rappel supprimé");
    if (done) onReminders(reminders.filter((r) => r.id !== reminder.id));
  };

  return (
    <>
      <Card title="Nouveau rappel">
        <ReminderForm onAdd={add} />
      </Card>

      <Card title="Mes rappels">
        {reminders.length === 0 ? (
          <EmptyState>Aucun rappel. Crée-en un pour recevoir une notification.</EmptyState>
        ) : (
          <ul className="-my-1 divide-y divide-line">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="flex items-center gap-3 py-2.5">
                <Toggle
                  checked={reminder.enabled}
                  label={`${reminder.enabled ? "Désactiver" : "Activer"} ${reminder.title}`}
                  onChange={(enabled) => toggle(reminder, enabled)}
                />
                <div className={`min-w-0 flex-1 ${reminder.enabled ? "" : "opacity-50"}`}>
                  <p className="truncate font-medium">{reminder.title}</p>
                  {reminder.body && <p className="truncate text-sm text-muted">{reminder.body}</p>}
                  <p className="mt-0.5 text-xs text-muted">
                    {dateFormat.format(new Date(reminder.remind_at))}
                    {reminder.recurrence !== "none" && (
                      <span className="ml-2 rounded-full bg-info/15 px-2 py-0.5 text-info">
                        {RECURRENCE_LABELS[reminder.recurrence]}
                      </span>
                    )}
                  </p>
                </div>
                <IconButton
                  label={`Supprimer ${reminder.title}`}
                  className="hover:text-danger"
                  onClick={() => remove(reminder)}
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

function ReminderForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [when, setWhen] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    // "when" est en heure locale : on l'envoie en ISO (UTC) au serveur
    const created = await onAdd({ title, body, recurrence, remind_at: new Date(when).toISOString() });
    setPending(false);
    if (created) {
      setTitle("");
      setBody("");
      setWhen("");
      setRecurrence("none");
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <Field label="Titre" className="col-span-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Payer le loyer" required />
      </Field>
      <Field label="Détail (optionnel)" className="col-span-2">
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Virement avant le 5" />
      </Field>
      <Field label="Date et heure" className="col-span-2">
        <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
      </Field>
      <Field label="Répétition" className="col-span-2">
        <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
          {RECURRENCES.map((r) => (
            <option key={r} value={r}>
              {RECURRENCE_LABELS[r]}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit" className="col-span-2" disabled={pending}>
        <PlusIcon />
        Ajouter le rappel
      </Button>
    </form>
  );
}
