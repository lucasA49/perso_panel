// Génère les icônes PWA dans public/ (à relancer seulement si le visuel change).
// Lancer avec : node scripts/gen-icons.mjs
import { writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og.js";

// padding : marge de sécurité pour les icônes "maskable" ; radius : coins arrondis
function icon(size, { padding = 0, radius = 0.22 } = {}) {
  const inner = size * (1 - padding * 2);
  const el = (type, style, children) => ({ type, props: { style, children } });
  const bar = (height, color) =>
    el("div", { width: inner * 0.13, height: inner * height, background: color, borderRadius: inner * 0.04 });

  return new ImageResponse(
    el(
      "div",
      {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: padding ? "#0f1115" : "transparent",
      },
      el(
        "div",
        {
          width: inner,
          height: inner,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: inner * 0.07,
          paddingBottom: inner * 0.24,
          background: "linear-gradient(160deg, #1f232d, #0f1115)",
          borderRadius: padding ? 0 : inner * radius,
        },
        [bar(0.22, "#fbbf24"), bar(0.36, "#60a5fa"), bar(0.52, "#34d399")]
      )
    ),
    { width: size, height: size }
  );
}

const files = {
  "icon-192.png": icon(192),
  "icon-512.png": icon(512),
  "icon-maskable-512.png": icon(512, { padding: 0.12 }),
  "apple-touch-icon.png": icon(180, { radius: 0 }),
};

for (const [name, response] of Object.entries(files)) {
  await writeFile(new URL(`../public/${name}`, import.meta.url), Buffer.from(await response.arrayBuffer()));
  console.log("✓ public/" + name);
}
