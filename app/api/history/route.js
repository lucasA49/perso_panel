import { handle, json } from "@/lib/http";
import { getHistory } from "@/lib/history";

// Historique : une photo du budget par mois
export const GET = handle(async () => json(await getHistory()));
