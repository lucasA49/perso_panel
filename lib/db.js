// Connexion PostgreSQL (serveur uniquement) + création automatique du schéma
import "server-only";
import pg from "pg";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS fixed_expenses (
  id         SERIAL PRIMARY KEY,
  label      TEXT    NOT NULL,
  amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  category   TEXT    NOT NULL DEFAULT 'Autre',
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         SERIAL PRIMARY KEY,
  endpoint   TEXT NOT NULL UNIQUE,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

// Conservé sur globalThis pour ne pas rouvrir un pool à chaque rechargement en dev
const store = (globalThis.__persoPanelDb ??= { pool: null, ready: null });

export const dbConfigured = () => Boolean(process.env.DATABASE_URL);

function getPool() {
  if (!dbConfigured()) {
    throw new Error("DATABASE_URL manquant — renseigne les variables d'environnement");
  }
  if (!store.pool) {
    const useSsl = String(process.env.DATABASE_SSL).toLowerCase() === "true";
    store.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: 5,
    });
  }
  return store.pool;
}

// Crée les tables au premier accès (idempotent)
function ensureSchema() {
  if (!store.ready) {
    store.ready = getPool()
      .query(SCHEMA)
      .catch((err) => {
        store.ready = null; // on retentera à la prochaine requête
        throw err;
      });
  }
  return store.ready;
}

export async function query(text, params) {
  await ensureSchema();
  return getPool().query(text, params);
}
