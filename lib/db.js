// Base de données (serveur uniquement) + création automatique du schéma.
// Par défaut : base embarquée dans le projet (PGlite = PostgreSQL en WebAssembly), stockée dans DATA_DIR.
// Si DATABASE_URL est défini : PostgreSQL externe à la place.
import "server-only";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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

-- Une photo du budget par mois ("AAAA-MM")
CREATE TABLE IF NOT EXISTS monthly_snapshots (
  month          TEXT PRIMARY KEY,
  salary         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_fixed    NUMERIC(12,2) NOT NULL DEFAULT 0,
  savings_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  budget_sortie  NUMERIC(12,2) NOT NULL DEFAULT 0,
  expenses       JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dépenses réelles saisies au fil du mois (conservées tant qu'elles ne sont pas supprimées)
CREATE TABLE IF NOT EXISTS transactions (
  id         SERIAL PRIMARY KEY,
  label      TEXT NOT NULL,
  amount     NUMERIC(12,2) NOT NULL,
  category   TEXT NOT NULL DEFAULT 'Autre',
  spent_on   DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_spent_on ON transactions (spent_on);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         SERIAL PRIMARY KEY,
  endpoint   TEXT NOT NULL UNIQUE,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

// Conservé sur globalThis pour ne pas rouvrir la base à chaque rechargement en dev
const store = (globalThis.__persoPanelDb ??= { ready: null });

// Dossier de la base embarquée. En production, par défaut dans le dossier personnel de l'utilisateur :
// hors du dossier de l'application, donc conservé quand un déploiement remplace les fichiers.
export function dataDir() {
  if (process.env.DATA_DIR) return path.resolve(process.env.DATA_DIR);
  return process.env.NODE_ENV === "production"
    ? path.join(os.homedir(), "perso-panel-data")
    : path.resolve("data");
}

export const usesExternalDb = () => Boolean(process.env.DATABASE_URL);

async function openExternal() {
  const { default: pg } = await import("pg");
  const useSsl = String(process.env.DATABASE_SSL).toLowerCase() === "true";
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: 5,
  });
  await pool.query(SCHEMA);
  return (text, params) => pool.query(text, params);
}

async function openEmbedded() {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = path.join(dataDir(), "pgdata");
  await mkdir(dir, { recursive: true });
  const db = await PGlite.create(dir);
  await db.exec(SCHEMA);
  console.log(`[db] Base embarquée ouverte : ${dir}`);
  return (text, params) => db.query(text, params);
}

// Ouvre la base et crée les tables au premier accès (idempotent)
function connect() {
  if (!store.ready) {
    store.ready = (usesExternalDb() ? openExternal() : openEmbedded()).catch((err) => {
      store.ready = null; // on retentera à la prochaine requête
      throw err;
    });
  }
  return store.ready;
}

export async function query(text, params) {
  const run = await connect();
  return run(text, params);
}
