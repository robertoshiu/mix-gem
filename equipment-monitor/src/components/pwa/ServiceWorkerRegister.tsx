"use client";

import { useEffect } from "react";

// Registers the Workbox service worker generated at out/sw.js (served at /mix-gem/sw.js).
// basePath hard-coded per repo convention. No-op in dev (sw.js only exists in the static export).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    const register = () => {
      navigator.serviceWorker
        .register("/mix-gem/sw.js", { scope: "/mix-gem/" })
        .catch((err) => console.error("[pwa] SW registration failed", err));
    };
    // The window `load` event often fires before this effect runs on fast static
    // pages, so register immediately if the document already finished loading.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
