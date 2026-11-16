// Génère les icônes de l'app et des notifications dans public/
// (à relancer seulement si le visuel change) : node scripts/gen-icons.mjs
import { writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og.js";

const el = (type, props = {}, children) => ({ type, props: { ...props, children } });

// Anneau de budget (jauge aux trois quarts) + symbole € au centre
function glyph(size, { color = "#ffffff", track = "rgba(255,255,255,0.28)" } = {}) {
  const stroke = size * 0.115;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const circle = (extra) =>
    el("circle", { cx: size / 2, cy: size / 2, r, fill: "none", strokeWidth: stroke, ...extra });

  return el("div", { style: { display: "flex", position: "relative", width: size, height: size } }, [
    el(
      "svg",
      { width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { position: "absolute", top: 0, left: 0 } },
      [
        circle({ stroke: track }),
        circle({
          stroke: color,
          strokeLinecap: "round",
          strokeDasharray: `${c * 0.72} ${c}`,
          transform: `rotate(-90 ${size / 2} ${size / 2})`,
        }),
      ]
    ),
    el(
      "div",
      {
        style: {
          display: "flex",
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
          color,
          fontSize: size * 0.54,
          fontWeight: 700,
        },
      },
      "€"
    ),
  ]);
}

// Icône d'app : dégradé vif + reflet, glyphe blanc. "bleed" = fond plein cadre (maskable / iOS)
function appIcon(size, { bleed = false, scale = 0.62 } = {}) {
  return new ImageResponse(
    el(
      "div",
      {
        style: {
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: bleed ? 0 : size * 0.225,
          background: "linear-gradient(145deg, #5eead4 0%, #10b981 38%, #0284c7 100%)",
        },
      },
      [
        el("div", {
          style: {
            position: "absolute",
            top: -size * 0.35,
            left: -size * 0.2,
            width: size * 0.95,
            height: size * 0.95,
            borderRadius: size,
            background: "radial-gradient(circle, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 68%)",
          },
        }),
        el("div", {
          style: {
            position: "absolute",
            bottom: -size * 0.4,
            right: -size * 0.3,
            width: size,
            height: size,
            borderRadius: size,
            background: "radial-gradient(circle, rgba(49,46,129,0.45) 0%, rgba(49,46,129,0) 70%)",
          },
        }),
        glyph(size * scale),
      ]
    ),
    { width: size, height: size }
  );
}

// Pastille monochrome (blanc sur transparent) pour la barre d'état Android
function badge(size) {
  return new ImageResponse(
    el(
      "div",
      { style: { display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" } },
      glyph(size * 0.86, { track: "rgba(255,255,255,0)" })
    ),
    { width: size, height: size }
  );
}

const files = {
  "icon-192.png": appIcon(192),
  "icon-512.png": appIcon(512),
  "icon-maskable-512.png": appIcon(512, { bleed: true, scale: 0.46 }),
  "apple-touch-icon.png": appIcon(180, { bleed: true }),
  "badge-96.png": badge(96),
};

for (const [name, response] of Object.entries(files)) {
  await writeFile(new URL(`../public/${name}`, import.meta.url), Buffer.from(await response.arrayBuffer()));
  console.log("✓ public/" + name);
}
