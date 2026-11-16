// Génère une paire de clés VAPID pour les notifications Web Push.
// Lancer avec : npm run gen-vapid
import { generateVAPIDKeys } from "web-push";

const keys = generateVAPIDKeys();

console.log("\nAjoute ces lignes à tes variables d'environnement (.env.local / panneau Hostinger) :\n");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}\n`);
console.log("⚠️  Ne les régénère plus ensuite : tous les appareils déjà abonnés seraient déconnectés.\n");
