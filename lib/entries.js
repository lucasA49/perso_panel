// Validation commune aux lignes datées : dépenses réelles et revenus (serveur uniquement)
import "server-only";
import { today } from "./dates";
import { firstMonth } from "./history";

const isDay = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

// Renvoie { day } (aujourd'hui par défaut) ou { error } si la date est refusée
export async function resolveDay(value) {
  const day = value === undefined || value === null || value === "" ? today() : value;
  if (!isDay(day)) return { error: "Date invalide" };
  if (day > today()) return { error: "La date ne peut pas être dans le futur" };
  // La ligne doit tomber dans un mois présent dans l'historique, sinon elle serait invisible
  if (day.slice(0, 7) < (await firstMonth())) return { error: "Date antérieure au début de l'historique" };
  return { day };
}

// Renvoie le montant (> 0) ou null
export function readAmount(value) {
  const amount = Number(value);
  return Number.isNaN(amount) || amount <= 0 ? null : amount;
}
