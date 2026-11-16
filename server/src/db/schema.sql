-- Schéma de la base perso_panel

-- Stockage clé/valeur pour les réglages simples (salaire, config épargne, etc.)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Dépenses fixes mémorisées
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id         SERIAL PRIMARY KEY,
  label      TEXT    NOT NULL,
  amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  category   TEXT    NOT NULL DEFAULT 'Autre',
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rappels du calendrier
CREATE TABLE IF NOT EXISTS reminders (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  remind_at     TIMESTAMPTZ NOT NULL,
  recurrence    TEXT NOT NULL DEFAULT 'none', -- none | daily | weekly | monthly
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  last_fired_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders (remind_at) WHERE enabled = TRUE;

-- Abonnements Web Push (un par appareil)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         SERIAL PRIMARY KEY,
  endpoint   TEXT NOT NULL UNIQUE,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
