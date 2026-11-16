import { json } from "@/lib/http";
import { pushConfigured } from "@/lib/push";

// Lu à chaque requête : les clés viennent de l'environnement du serveur
export const dynamic = "force-dynamic";

export const GET = () =>
  json({ publicKey: process.env.VAPID_PUBLIC_KEY || null, configured: pushConfigured() });
