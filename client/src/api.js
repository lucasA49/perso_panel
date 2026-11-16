// Petite couche d'accès à l'API du serveur
const BASE = '/api';

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  getState: () => req('/state'),
  saveSettings: (payload) => req('/settings', { method: 'PUT', body: JSON.stringify(payload) }),

  addExpense: (payload) => req('/expenses', { method: 'POST', body: JSON.stringify(payload) }),
  updateExpense: (id, payload) => req(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteExpense: (id) => req(`/expenses/${id}`, { method: 'DELETE' }),

  getReminders: () => req('/reminders'),
  addReminder: (payload) => req('/reminders', { method: 'POST', body: JSON.stringify(payload) }),
  updateReminder: (id, payload) => req(`/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteReminder: (id) => req(`/reminders/${id}`, { method: 'DELETE' }),

  getVapid: () => req('/push/vapid'),
  subscribePush: (sub) => req('/push/subscribe', { method: 'POST', body: JSON.stringify(sub) }),
  testPush: () => req('/push/test', { method: 'POST' }),
};

export const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
