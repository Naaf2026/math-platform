"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock3, Crown, Sparkles, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Entitlement = {
  plan_slug: string;
  plan_name: string;
  subscription_status: string;
  trial_ends_at: string | null;
  feature_key: string;
  enabled: boolean;
  daily_limit: number | null;
};

const trialFeatures = [
  ["Math practice", "10 questions/day"],
  ["Visual questions", "2/day"],
  ["Brain Games", "2/day"],
  ["Daily Challenge", "Included"],
  ["Textbook practice", "5 questions/day"],
];

const premiumFeatures = [
  "Unlimited math practice",
  "50 AI questions/day",
  "20 visual questions/day",
  "10 Brain Games/day",
  "Full textbook practice",
  "Advanced analytics",
  "Exam preparation",
  "XP, badges, rewards & Mind Sparks",
];

function daysLeft(value: string | null) {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86400000));
}

export default function SubscriptionPage() {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionTrialEnds, setSubscriptionTrialEnds] = useState<string | null>(null);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [upgradeRequesting, setUpgradeRequesting] = useState(false);
  const [upgradeRequested, setUpgradeRequested] = useState(false);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.rpc("get_my_entitlements");
    setEntitlements((data ?? []) as Entitlement[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const supabase = createClient();
    if (!supabase) return;
    void supabase.rpc("get_my_subscription_status").then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : data;
      setSubscriptionStatus(row?.subscription_status ?? null);
      setSubscriptionTrialEnds(row?.trial_ends_at ?? null);
    });
  }, []);

  const trialEnds = subscriptionTrialEnds ?? entitlements.reduce<string | null>((latest, item) => {
    if (!item.trial_ends_at) return latest;
    if (!latest) return item.trial_ends_at;
    return new Date(item.trial_ends_at).getTime() > new Date(latest).getTime() ? item.trial_ends_at : latest;
  }, null);
  const remaining = daysLeft(trialEnds);
  const trialing = subscriptionStatus === "trialing" && remaining > 0;
  const active = subscriptionStatus === "active";
  async function requestUpgrade() {
    setUpgradeRequesting(true);
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("Please log in first.");
      setUpgradeRequesting(false);
      return;
    }
    const { error } = await supabase.rpc("request_premium_upgrade");
    if (error) {
      setMessage(error.message || "We could not send the request.");
    } else {
      setMessage("");
      setShowUpgradeConfirm(false);
      setUpgradeRequested(true);
    }
    setUpgradeRequesting(false);
  }

  async function startTrial() {
    setStarting(true);
    setMessage("");
    const supabase = createClient();
    if (!supabase) { setMessage("Please log in first."); setStarting(false); return; }
    const { error } = await supabase.rpc("start_premium_trial");
    if (error) setMessage(error.message.includes("already") ? "Your 7-day trial has already been used." : error.message);
    else { setMessage("Your 7-day Premium trial is now active!"); await load(); }
    setStarting(false);
  }

  return (
    <main className="min-h-screen bg-[#eef9ff] text-[#083d78]">
      <header className="border-b border-[#dcecf6] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 font-black text-[#197fe9]"><ArrowLeft size={18} /> Dashboard</Link>
          <div className="flex items-center gap-2 font-black"><Crown size={20} className="text-[#f3a900]" /> My Premium</div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#fff4cf] px-4 py-2 text-sm font-black text-[#8b6a00]"><Sparkles size={16} /> Learn more. Practise more. Master maths.</div>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Choose your learning plan</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold leading-7 text-[#6685a4]">Try Premium for 7 days with sensible daily limits, then continue for just MVR 150/month.</p>
        </div>

        {message && <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-[#cfe6f7] bg-white px-5 py-4 text-center font-bold shadow-sm">{message}</div>}

        {showUpgradeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
            <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1c2]">
                <Crown size={28} className="text-[#e3a100]" />
              </div>
              <h3 className="mt-5 text-center text-2xl font-black text-[#083d78]">Request Premium upgrade?</h3>
              <p className="mt-3 text-center font-semibold leading-6 text-[#6685a4]">
                Your parent will receive a notification in their notification center asking them to review your request and complete the MVR 150 monthly Premium payment.
              </p>
              {trialing && <p className="mt-3 rounded-xl bg-[#eef9ff] px-4 py-3 text-center text-sm font-bold text-[#197fe9]">Your current trial will continue until it ends.</p>}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button onClick={() => setShowUpgradeConfirm(false)} disabled={upgradeRequesting} className="rounded-2xl border-2 border-[#dcecf6] px-5 py-3 font-black text-[#6685a4]">Cancel</button>
                <button onClick={requestUpgrade} disabled={upgradeRequesting} className="rounded-2xl bg-[#197fe9] px-5 py-3 font-black text-white disabled:opacity-60">{upgradeRequesting ? "Sending…" : "Yes, notify my parent"}</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[30px] border-2 border-[#cfe6f7] bg-white p-6 shadow-lg sm:p-8">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-black uppercase tracking-widest text-[#6685a4]">Start here</p><h2 className="mt-2 text-3xl font-black">7-Day Trial</h2></div>
              <div className="rounded-2xl bg-[#eaf7ff] p-3"><Clock3 size={28} className="text-[#197fe9]" /></div>
            </div>
            <p className="mt-4 text-2xl font-black">MVR 0 <span className="text-sm text-[#6685a4]">for 7 days</span></p>
            <div className="mt-6 space-y-3">
              {trialFeatures.map(([name, limit]) => <div key={name} className="flex items-center justify-between gap-4 rounded-xl bg-[#f6fbff] px-4 py-3"><span className="font-bold">{name}</span><span className="text-sm font-black text-[#197fe9]">{limit}</span></div>)}
            </div>
            <button onClick={startTrial} disabled={starting || trialing || active} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#197fe9] px-5 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#126fce] disabled:cursor-not-allowed disabled:opacity-50">
              {trialing ? `${remaining} day${remaining === 1 ? "" : "s"} left in your Premium Trial` : active ? "Premium Active" : starting ? "Starting trial…" : "Start 7-Day Premium Trial"}
            </button>
            {loading && <p className="mt-3 text-center text-sm font-semibold text-[#6685a4]">Checking your subscription…</p>}
          </article>

          <article className="relative overflow-hidden rounded-[30px] border-2 border-[#ffca3a] bg-white p-6 shadow-xl sm:p-8">
            <div className="absolute right-5 top-5 rounded-full bg-[#fff0a8] px-3 py-1 text-xs font-black text-[#765800]">BEST VALUE</div>
            <div className="flex items-center gap-3"><div className="rounded-2xl bg-[#fff1c2] p-3"><Crown size={28} className="text-[#e3a100]" /></div><div><p className="text-sm font-black uppercase tracking-widest text-[#a77a00]">Premium</p><h2 className="text-3xl font-black">Full Access</h2></div></div>
            <div className="mt-5 flex items-end gap-2"><span className="text-5xl font-black">MVR 150</span><span className="pb-1 font-bold text-[#6685a4]">/ month</span></div>
            <p className="mt-2 font-semibold text-[#6685a4]">Or MVR 1,500/year — save MVR 300.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {premiumFeatures.map((feature) => <div key={feature} className="flex items-start gap-2 rounded-xl bg-[#fffaf0] px-3 py-2.5 text-sm font-bold"><Check size={17} className="mt-0.5 shrink-0 text-[#13a56f]" />{feature}</div>)}
            </div>
            <button
              onClick={() => setShowUpgradeConfirm(true)}
              disabled={active || upgradeRequesting}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#20265b] px-5 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#171b49] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Zap size={18} className="text-[#ffd34e]" fill="currentColor" /> {active ? "Premium Active" : "Upgrade Now!!"}
            </button>
            <p className="mt-3 text-center text-xs font-semibold text-[#7b819f]">Payment checkout will be connected after the Maldives payment provider is selected.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
