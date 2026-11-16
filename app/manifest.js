// Manifest PWA (installation sur l'écran d'accueil)
export default function manifest() {
  return {
    name: "Perso Panel",
    short_name: "Perso",
    description: "Budget, dépenses et rappels perso",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#0f1115",
    background_color: "#0f1115",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
