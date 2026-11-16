// Petite couche d'accès à l'API (côté navigateur)
const BASE = "/api";

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

const send = (method) => (path, payload) =>
  req(path, { method, body: payload === undefined ? undefined : JSON.stringify(payload) });
const post = send("POST");
const put = send("PUT");
const patch = send("PATCH");
const del = send("DELETE");

export const api = {
  getState: () => req("/state"),
  saveSettings: (payload) => put("/settings", payload),

  addExpense: (payload) => post("/expenses", payload),
  updateExpense: (id, payload) => patch(`/expenses/${id}`, payload),
  deleteExpense: (id) => del(`/expenses/${id}`),

  getHistory: () => req("/history"),

  getReminders: () => req("/reminders"),
  addReminder: (payload) => post("/reminders", payload),
  updateReminder: (id, payload) => patch(`/reminders/${id}`, payload),
  deleteReminder: (id) => del(`/reminders/${id}`),

  getVapid: () => req("/push/vapid"),
  subscribePush: (sub) => post("/push/subscribe", sub),
  testPush: () => post("/push/test"),
};

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const fmt = (n) => euro.format(Number(n) || 0);
