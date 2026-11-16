import { handle, json } from "@/lib/http";
import { sendToAll } from "@/lib/push";

// Test : envoie une notification à tous les appareils abonnés
export const POST = handle(async () =>
  json(
    await sendToAll({
      title: "Perso Panel ✅",
      body: "Les notifications fonctionnent !",
      url: "/",
    })
  )
);
