// Helpers communs aux Route Handlers
import "server-only";
import { NextResponse } from "next/server";

export const json = (data, status = 200) => NextResponse.json(data, { status });
export const badRequest = (message) => json({ error: message }, 400);

// Enveloppe un handler : toute exception devient une réponse 500 propre
export function handle(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (err) {
      console.error("[api]", err.message);
      return json({ error: "Erreur serveur" }, 500);
    }
  };
}

// Corps JSON de la requête, ou {} s'il est absent / invalide
export const readBody = (request) => request.json().catch(() => ({}));

// Identifiant numérique de la route dynamique, ou null s'il est invalide
export async function readId(context) {
  const { id } = await context.params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}
