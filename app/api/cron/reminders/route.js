import { handle, json } from "@/lib/http";
import { checkReminders } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

// Déclenchement externe des rappels (tâche cron de l'hébergeur), protégé par CRON_SECRET
export const GET = handle(async (request) => {
  const secret = process.env.CRON_SECRET;
  const given = new URL(request.url).searchParams.get("secret");
  if (!secret || given !== secret) return json({ error: "Non autorisé" }, 401);
  return json(await checkReminders());
});
