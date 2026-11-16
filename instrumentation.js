// Exécuté une fois au démarrage du serveur Next.js : lance le planificateur de rappels
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { startScheduler } = await import("./lib/scheduler");
  startScheduler();
}
