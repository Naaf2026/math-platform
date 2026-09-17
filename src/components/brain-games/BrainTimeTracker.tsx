"use client";

import { Clock3 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "brain_game_active_session";

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60).toString().padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`;
}

export default function BrainTimeTracker() {
  const pathname = usePathname();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const read = () => setSessionId(window.localStorage.getItem(STORAGE_KEY));
    read();
    window.addEventListener("storage", read);
    const timer = window.setInterval(read, 1000);
    return () => { window.removeEventListener("storage", read); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!sessionId || pathname === "/brain-games") {
      setActive(false);
      return;
    }

    let cancelled = false;
    let interval: number | undefined;
    const supabase = createClient();

    const sync = async () => {
      const { data, error } = await supabase.rpc("sync_brain_game_time", { p_session_id: sessionId });
      if (cancelled) return;
      if (error || !data?.active) {
        window.localStorage.removeItem(STORAGE_KEY);
        setActive(false);
        return;
      }
      setActive(true);
      setSeconds(Number(data.seconds_remaining ?? 0));
      if (Number(data.seconds_remaining ?? 0) <= 0) {
        await supabase.rpc("pause_brain_game", { p_session_id: sessionId });
      }
    };

    const pause = () => {
      void supabase.rpc("pause_brain_game", { p_session_id: sessionId });
    };

    void sync();
    interval = window.setInterval(() => void sync(), 10000);
    const onVisibility = () => { if (document.visibilityState === "hidden") pause(); else void sync(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", pause);

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", pause);
      pause();
    };
  }, [sessionId, pathname]);

  useEffect(() => {
    if (!active || seconds === null) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, (value ?? 0) - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [active, seconds === null]);

  if (!active || seconds === null || pathname === "/brain-games") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[90] -translate-x-1/2 rounded-full border-2 border-white/90 bg-slate-950/90 px-4 py-2 text-sm font-black text-white shadow-2xl backdrop-blur-md">
      <Clock3 className="mr-1.5 inline-block" size={16} />
      Brain Time <span className="ml-1 text-cyan-300">{formatTime(seconds)}</span>
    </div>
  );
}
