import { dataDir, query, usesExternalDb } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

// Diagnostic : où sont stockées les données et depuis quand la base existe
export async function GET() {
  const storage = usesExternalDb() ? { database: "postgres externe" } : { database: "embarquée", dataDir: dataDir() };
  try {
    const { rows } = await query("SELECT min(created_at) AS since FROM monthly_snapshots");
    return json({ ok: true, ...storage, since: rows[0].since });
  } catch (err) {
    return json({ ok: false, ...storage, error: err.message }, 500);
  }
}
