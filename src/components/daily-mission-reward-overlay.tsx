"use client";

import { useEffect, useState } from "react";
import { X, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DailyMissionReward from "@/components/daily-mission-reward";

type MissionState = { mission_id: string; status: string };

export default function DailyMissionRewardOverlay() {
  const pathname = usePathname();
  const [missionId, setMissionId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname !== "/mission") {
      setVisible(false);
      setMissionId(null);
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function checkMission() {
      const supabase = createClient();
      if (!supabase) return;

      const { data } = await supabase.rpc("get_daily_mission", { p_target_questions: 10 });
      const row = (data?.[0] || null) as MissionState | null;
      if (!active || !row || row.status !== "completed") return;

      const key = `fv-mission-reward-shown-${row.mission_id}`;
      if (sessionStorage.getItem(key) === "1") return;

      const { data: rewardData, error } = await supabase.rpc("complete_daily_mission_reward");
      if (!active || error || !rewardData?.[0]) return;

      sessionStorage.setItem(key, "1");
      setMissionId(row.mission_id);
      setVisible(true);
      if (timer) clearInterval(timer);
    }

    void checkMission();
    timer = setInterval(() => void checkMission(), 2000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [pathname]);

  if (!visible || !missionId) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2.25rem] bg-white p-5 shadow-2xl ring-1 ring-white/30 sm:p-7">
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Close mission reward"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
        >
          <X size={18} />
        </button>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 to-orange-400 text-white shadow-lg">
            <Trophy size={30} />
          </div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[.22em] text-orange-500">Mission complete</p>
          <h2 className="mt-1 text-3xl font-black text-[#15233f]">Your rewards are ready! 🎉</h2>
        </div>
        <DailyMissionReward missionId={missionId} />
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="mt-5 w-full rounded-2xl bg-[#15233f] px-6 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
