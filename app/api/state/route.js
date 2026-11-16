import { getFullState } from "@/lib/budget";
import { handle, json } from "@/lib/http";

// État global : réglages + dépenses + calcul du budget
export const GET = handle(async () => json(await getFullState()));
