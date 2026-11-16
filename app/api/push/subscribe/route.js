import { query } from "@/lib/db";
import { badRequest, handle, json, readBody } from "@/lib/http";

// Enregistre (ou met à jour) l'abonnement push d'un appareil
export const POST = handle(async (request) => {
  const sub = await readBody(request);
  if (!sub || !sub.endpoint) return badRequest("Abonnement invalide");

  await query(
    `INSERT INTO push_subscriptions (endpoint, data) VALUES ($1, $2)
     ON CONFLICT (endpoint) DO UPDATE SET data = EXCLUDED.data`,
    [sub.endpoint, JSON.stringify(sub)]
  );
  return json({ ok: true }, 201);
});
