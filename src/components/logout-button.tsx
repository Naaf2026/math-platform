"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={busy}
      title="Log out"
      aria-label="Log out"
      className={compact
        ? "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        : "group relative flex h-12 w-12 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"}
    >
      <LogOut size={compact ? 18 : 21} />
      {compact && <span>{busy ? "Logging out…" : "Log out"}</span>}
      {!compact && <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">Log out</span>}
    </button>
  );
}
