"use client";

import { useEffect } from "react";

export default function ParentPwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Never cache private parent pages, student results, or authenticated API responses.
    void navigator.serviceWorker.register("/parent-app-sw.js", { scope: "/parent/app" }).catch(() => {});
  }, []);
  return null;
}
