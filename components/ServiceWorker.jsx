"use client";

import { useEffect } from "react";

// Enregistre le service worker (nécessaire aux notifications push)
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("[sw] Enregistrement impossible :", err));
  }, []);

  return null;
}
