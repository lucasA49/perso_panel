import { Router } from 'express';
import { query } from './db/pool.js';
import { getFullState, setSetting } from './budget.js';
import { pushConfigured, sendToAll } from './push.js';

export const router = Router();

/* ---------------- État global (réglages + dépenses + calcul) ---------------- */
router.get('/state', async (req, res, next) => {
  try {
    res.json(await getFullState());
  } catch (err) {
    next(err);
  }
});

/* ---------------- Réglages (salaire + épargne) ---------------- */
router.put('/settings', async (req, res, next) => {
  try {
    const { salary, savings } = req.body;
    if (salary !== undefined) {
      const n = Number(salary);
      if (Number.isNaN(n) || n < 0) return res.status(400).json({ error: 'Salaire invalide' });
      await setSetting('salary', n);
    }
    if (savings !== undefined) {
      const mode = savings.mode === 'amount' ? 'amount' : 'percent';
      const value = Math.max(0, Number(savings.value) || 0);
      await setSetting('savings', { mode, value });
    }
    res.json(await getFullState());
  } catch (err) {
    next(err);
  }
});

/* ---------------- Dépenses fixes ---------------- */
router.post('/expenses', async (req, res, next) => {
  try {
    const { label, amount, category } = req.body;
    if (!label || !String(label).trim()) return res.status(400).json({ error: 'Libellé requis' });
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) return res.status(400).json({ error: 'Montant invalide' });

    await query(
      'INSERT INTO fixed_expenses (label, amount, category) VALUES ($1, $2, $3)',
      [String(label).trim(), amt, (category && String(category).trim()) || 'Autre']
    );
    res.status(201).json(await getFullState());
  } catch (err) {
    next(err);
  }
});

router.patch('/expenses/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { label, amount, category, active } = req.body;
    const fields = [];
    const values = [];
    let i = 1;

    if (label !== undefined) { fields.push(`label = $${i++}`); values.push(String(label).trim()); }
    if (amount !== undefined) { fields.push(`amount = $${i++}`); values.push(Number(amount)); }
    if (category !== undefined) { fields.push(`category = $${i++}`); values.push(String(category).trim() || 'Autre'); }
    if (active !== undefined) { fields.push(`active = $${i++}`); values.push(Boolean(active)); }

    if (!fields.length) return res.status(400).json({ error: 'Rien à modifier' });
    values.push(id);
    await query(`UPDATE fixed_expenses SET ${fields.join(', ')} WHERE id = $${i}`, values);
    res.json(await getFullState());
  } catch (err) {
    next(err);
  }
});

router.delete('/expenses/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM fixed_expenses WHERE id = $1', [Number(req.params.id)]);
    res.json(await getFullState());
  } catch (err) {
    next(err);
  }
});

/* ---------------- Rappels / calendrier ---------------- */
router.get('/reminders', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM reminders ORDER BY remind_at ASC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/reminders', async (req, res, next) => {
  try {
    const { title, body, remind_at, recurrence } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Titre requis' });
    if (!remind_at || Number.isNaN(Date.parse(remind_at))) return res.status(400).json({ error: 'Date invalide' });
    const rec = ['none', 'daily', 'weekly', 'monthly'].includes(recurrence) ? recurrence : 'none';

    const { rows } = await query(
      `INSERT INTO reminders (title, body, remind_at, recurrence)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [String(title).trim(), String(body || '').trim(), remind_at, rec]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch('/reminders/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, body, remind_at, recurrence, enabled } = req.body;
    const fields = [];
    const values = [];
    let i = 1;
    if (title !== undefined) { fields.push(`title = $${i++}`); values.push(String(title).trim()); }
    if (body !== undefined) { fields.push(`body = $${i++}`); values.push(String(body).trim()); }
    if (remind_at !== undefined) { fields.push(`remind_at = $${i++}`); values.push(remind_at); }
    if (recurrence !== undefined) { fields.push(`recurrence = $${i++}`); values.push(recurrence); }
    if (enabled !== undefined) { fields.push(`enabled = $${i++}`); values.push(Boolean(enabled)); }
    if (!fields.length) return res.status(400).json({ error: 'Rien à modifier' });
    values.push(id);
    const { rows } = await query(`UPDATE reminders SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/reminders/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM reminders WHERE id = $1', [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------------- Notifications Push ---------------- */
router.get('/push/vapid', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null, configured: pushConfigured });
});

router.post('/push/subscribe', async (req, res, next) => {
  try {
    const sub = req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Abonnement invalide' });
    await query(
      `INSERT INTO push_subscriptions (endpoint, data) VALUES ($1, $2)
       ON CONFLICT (endpoint) DO UPDATE SET data = EXCLUDED.data`,
      [sub.endpoint, JSON.stringify(sub)]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Test : envoie une notif à tous les appareils abonnés
router.post('/push/test', async (req, res, next) => {
  try {
    const result = await sendToAll({
      title: 'Perso Panel ✅',
      body: 'Les notifications fonctionnent !',
      url: '/',
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ---------------- Export / sauvegarde des données ---------------- */
router.get('/export', async (req, res, next) => {
  try {
    const [settings, expenses, reminders] = await Promise.all([
      query('SELECT key, value FROM settings'),
      query('SELECT label, amount, category, active FROM fixed_expenses'),
      query('SELECT title, body, remind_at, recurrence, enabled FROM reminders'),
    ]);
    res.setHeader('Content-Disposition', 'attachment; filename="perso-panel-backup.json"');
    res.json({
      exported_at: new Date().toISOString(),
      settings: settings.rows,
      expenses: expenses.rows,
      reminders: reminders.rows,
    });
  } catch (err) {
    next(err);
  }
});
