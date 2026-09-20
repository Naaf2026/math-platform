"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("notifications").select("id,type,title,message,link,is_read,created_at").order("created_at", { ascending: false }).limit(100);
    setItems((data as Notification[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase.channel("learner-notifications-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => void load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  async function markAllRead() {
    const supabase = createClient();
    if (!supabase || busy) return;
    setBusy(true);
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    setBusy(false);
    await load();
  }

  async function openNotification(item: Notification) {
    if (item.is_read) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from("notifications").update({ is_read: true }).eq("id", item.id);
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry));
  }

  const unread = items.filter((item) => !item.is_read).length;

  return (
    <main className="min-h-screen bg-[#eef9ff] px-4 py-6 text-[#083d78] sm:px-6 lg:pl-28 lg:pr-10 lg:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div><Link href="/dashboard" className="mb-3 inline-flex items-center gap-2 text-sm font-black text-[#6685a4] hover:text-[#197fe9]"><ArrowLeft size={17} /> Back to Dashboard</Link><div className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#dff1ff] text-[#197fe9]"><Bell size={28} /></div><div><h1 className="text-3xl font-black sm:text-4xl">Notifications</h1><p className="mt-1 text-sm font-semibold text-[#6685a4]">{unread ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "You’re all caught up 🎉"}</p></div></div></div>
          <button type="button" onClick={markAllRead} disabled={busy || unread === 0} className="hidden items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#197fe9] shadow-sm ring-1 ring-[#d8e8f4] disabled:opacity-40 sm:inline-flex"><CheckCheck size={17} /> Mark all as read</button>
        </div>

        {loading ? <div className="mt-8 rounded-[28px] bg-white p-10 text-center font-black shadow-sm">Loading notifications…</div> : items.length === 0 ? <div className="mt-8 rounded-[28px] bg-white p-12 text-center shadow-sm"><Bell className="mx-auto text-[#197fe9]" size={42} /><h2 className="mt-4 text-xl font-black">No notifications yet</h2><p className="mt-2 text-sm font-semibold text-[#7890a7]">Important learning updates will appear here.</p></div> : <div className="mt-8 overflow-hidden rounded-[28px] border border-[#d8e8f4] bg-white shadow-sm">{items.map((item) => <div key={item.id} className={`border-b border-[#eaf1f6] last:border-b-0 ${item.is_read ? "bg-white" : "bg-[#f0f8ff]"}`}><div className="flex gap-4 px-5 py-5 sm:px-6"><div className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.is_read ? "bg-[#edf3f8]" : "bg-[#dff1ff]"}`}>{item.type.startsWith("buddy") ? "🏆" : item.type === "achievement" ? "🏅" : "🔔"}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h2 className={`text-base ${item.is_read ? "font-bold" : "font-black"}`}>{item.title}</h2><p className="mt-1 text-sm font-semibold leading-6 text-[#6685a4]">{item.message}</p><p className="mt-2 text-xs font-black text-[#9aabba]">{relativeTime(item.created_at)}</p></div>{!item.is_read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />}</div>{item.link && <Link href={item.link} onClick={() => void openNotification(item)} className="mt-3 inline-flex items-center gap-1 text-sm font-black text-[#197fe9]">Open <ChevronRight size={16} /></Link>}</div></div></div>)}</div>}

        <button type="button" onClick={markAllRead} disabled={busy || unread === 0} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#197fe9] shadow-sm ring-1 ring-[#d8e8f4] disabled:opacity-40 sm:hidden"><CheckCheck size={17} /> Mark all as read</button>
      </div>
    </main>
  );
}
