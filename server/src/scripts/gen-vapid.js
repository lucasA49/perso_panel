// Génère une paire de clés VAPID pour les notifications Web Push.
// Lancer avec : npm run gen-vapid
// Colle les deux clés dans ton fichier .env (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).
import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('\nAjoute ces lignes à ton fichier .env :\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}\n`);
console.log('⚠️  Ne les régénère plus ensuite : tous les appareils déjà abonnés seraient déconnectés.\n');
