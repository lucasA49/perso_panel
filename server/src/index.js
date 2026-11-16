import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { router } from './routes.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',').map((s) => s.trim()) || '*',
  })
);

// API
app.use('/api', router);
app.get('/api/health', (req, res) => res.json({ ok: true }));

// En production : sert le build React (client/dist)
const clientDist = join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(join(clientDist, 'index.html'), (err) => {
    if (err) res.status(404).send('Build client absent — lance "npm run build" dans client/');
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('[api]', err.message);
  res.status(500).json({ error: 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`[server] API sur http://localhost:${PORT}`);
  startScheduler();
});
