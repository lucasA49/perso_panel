# Perso Panel

Application perso (PWA mobile) : budget mensuel, dépenses fixes et rappels avec notifications push.

@AGENTS.md

## Stack — à respecter strictement

- **Next.js 16 (App Router)** + **React 19**, en JavaScript (`.js` / `.jsx`, pas de TypeScript).
- **Tailwind CSS 4** pour tout le style. La palette est déclarée dans `app/globals.css` (`@theme`) :
  `bg`, `surface`, `raised`, `line`, `ink`, `muted`, `accent`, `danger`, `warn`, `info`.
- **Pas de vanilla** : pas de manipulation directe du DOM, pas de pages HTML à la main, pas de fichiers CSS
  par composant ni de `style={{…}}` (sauf valeur calculée, ex. largeur d'une barre). Tout passe par des
  composants React et des classes Tailwind.
- **Base embarquée dans le projet** : PGlite (PostgreSQL en WebAssembly), fichiers dans `DATA_DIR`
  (`./data` par défaut, ignoré par git). Aucun service externe requis. Si `DATABASE_URL` est défini,
  un PostgreSQL externe est utilisé à la place via `pg`. SQL PostgreSQL dans les deux cas, pas d'ORM.
- Une seule app à la racine du dépôt : le front et l'API sont dans Next.js (pas de serveur Express séparé).

## Commandes

```bash
npm run dev        # développement (http://localhost:3000)
npm run build      # build de production (webpack) — doit passer avant chaque push
npm run lint       # ESLint — doit passer avant chaque push
npm start          # serveur de production (utilise la variable PORT)
npm run gen-vapid  # génère les clés VAPID (une seule fois)
```

## Structure

```
app/
  layout.js, page.js, globals.css, manifest.js
  api/**/route.js        Route Handlers (API REST consommée par le front)
components/              Composants React client ("use client")
  ui.jsx                 Briques réutilisables : Card, Button, Input, Toggle, icônes…
  Dashboard.jsx          Coquille : chargement des données, onglets, toasts
  BudgetTab.jsx · RemindersTab.jsx · SettingsTab.jsx
lib/
  db.js                  Base embarquée (PGlite) + création auto des tables   (serveur)
  budget.js              Calcul du budget                                     (serveur)
  push.js                Envoi Web Push                                       (serveur)
  scheduler.js           Vérification des rappels chaque minute               (serveur)
  http.js                Helpers des Route Handlers : handle, json, readId…   (serveur)
  api-client.js          Appels à l'API + formatage €                         (navigateur)
  push-client.js         Abonnement aux notifications                         (navigateur)
  reminders.js           Constantes partagées
instrumentation.js       Démarre le scheduler au lancement du serveur
public/sw.js             Service worker (réception des notifications push)
scripts/                 gen-vapid.mjs, gen-icons.mjs
```

## Conventions

- Textes d'interface, messages d'erreur et commentaires en **français**.
- Les fichiers serveur de `lib/` commencent par `import "server-only"`. Ne jamais les importer
  depuis un composant client ; le front passe uniquement par `lib/api-client.js`.
- Chaque Route Handler est enveloppé dans `handle()` (`lib/http.js`) et valide ses entrées
  (`badRequest("…")`). `params` est une promesse : utiliser `readId(context)`.
- Requêtes SQL toujours paramétrées (`$1, $2…`), jamais de concaténation de valeurs.
- Nouveau composant d'interface : réutiliser `components/ui.jsx` avant d'en créer un autre.
- Mobile d'abord : largeur max `max-w-md`, zones tactiles ≥ 44 px (`min-h-11`), champs en `text-base`
  (évite le zoom iOS), respecter les `safe-area-inset`.
- Le schéma SQL vit dans `lib/db.js` (`SCHEMA`), en `CREATE … IF NOT EXISTS`. Toute évolution doit
  rester rejouable sans casser une base existante.

## Déploiement (Hostinger)

- Hostinger est connecté au dépôt GitHub, branche `main` : un push déclenche le déploiement.
- Build : `npm run build` — Démarrage : `npm start` — Node ≥ 20.9.
- Le build utilise webpack (`next build --webpack`) et Tailwind passe par PostCSS (`postcss.config.mjs`) :
  le build Turbopack échoue sur Hostinger (il ne peut pas y lancer ses processus Node auxiliaires).
  Ne pas revenir à Turbopack pour le build.
- Variables d'environnement à saisir dans le panneau Hostinger : voir `.env.example`.
  Ne jamais committer de `.env*` (seul `.env.example` est suivi).
- `DATA_DIR` doit pointer vers un dossier persistant hors du dossier de déploiement, sinon un
  redéploiement peut effacer les données. Ne jamais committer le dossier `data/`.
- La base embarquée n'accepte qu'un seul processus serveur à la fois (pas de mode cluster).
- Ne pas régénérer les clés VAPID une fois en production.
