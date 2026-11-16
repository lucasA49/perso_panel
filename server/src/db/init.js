// Crée les tables dans la base. Lancer avec : npm run init-db
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const sql = await readFile(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('[db] Tables créées / à jour ✅');
  await pool.end();
}

main().catch((err) => {
  console.error('[db] Erreur init :', err.message);
  process.exit(1);
});
