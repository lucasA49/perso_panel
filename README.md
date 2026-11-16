# Perso Panel

Budget mensuel, dépenses fixes et rappels avec notifications push — PWA mobile.

**Stack :** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · PostgreSQL

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis remplis DATABASE_URL (Neon, Supabase ou Postgres local)
npm run gen-vapid            # copie les deux clés dans .env.local
npm run dev                  # http://localhost:3000
```

Les tables sont créées automatiquement à la première requête.

## Déployer sur Hostinger

1. hPanel → **Sites web** → ajouter une **application Node.js** → importer depuis GitHub → ce dépôt, branche `main`.
2. Framework : **Next.js** — build : `npm run build` — démarrage : `npm start` — Node 20 ou 22.
3. Saisir les variables d'environnement de `.env.example` (`DATABASE_URL`, `DATABASE_SSL`, clés `VAPID_*`).
4. Déployer. Chaque push sur `main` redéploie ensuite automatiquement.

### Rappels

Le serveur vérifie les rappels chaque minute tant qu'il tourne. Si l'hébergeur met l'application en veille
sans visite, définis `CRON_SECRET` et crée une tâche cron (toutes les minutes) qui appelle :

```
https://ton-domaine.fr/api/cron/reminders?secret=<CRON_SECRET>
```

### Notifications sur iPhone

Ouvre le site dans Safari → Partager → **Sur l'écran d'accueil**, rouvre l'app depuis l'icône, puis
Réglages → Notifications → **Activer**. Le site doit être servi en HTTPS.
