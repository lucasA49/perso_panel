// Dates de l'app, toujours en heure de Paris (serveur uniquement)
import "server-only";

const TIME_ZONE = "Europe/Paris";
const dayFormat = new Intl.DateTimeFormat("fr-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Jour courant au format "AAAA-MM-JJ"
export const today = () => dayFormat.format(new Date());

// Mois courant au format "AAAA-MM"
export const currentMonth = () => today().slice(0, 7);
