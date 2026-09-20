"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
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
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const [{ data }, { count }] = await Promise.all([
      supabase.from("notifications").select("id,type,title,message,link,is_read,created_at").order("created_at", { ascending: false }).limit(6),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
    ]);
    setItems((data as Notification[]) ?? []);
    setUnread(count ?? 0);
  }

  useEffect(() => {
    void load();
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase.channel("learner-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => void load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, () => void load())
      .subscribe();

    const timer = window.setInterval(() => void load(), 30000);
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("mousedown", onClick);
      void supabase.removeChannel(channel);
    };
  }, []);

  async function markAllRead() {
    const supabase = createClient();
    if (!supabase || busy || unread === 0) return;
    setBusy(true);
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    setBusy(false);
    await load();
  }

  async function openNotification(item: Notification) {
    const supabase = createClient();
    if (supabase && !item.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", item.id);
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry));
      setUnread((value) => Math.max(0, value - 1));
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Notifications" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="relative grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10 sm:h-12 sm:w-12">
        <Bell size={24} />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-black leading-4 text-white shadow-sm">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-[58px] z-[80] w-[min(92vw,390px)] overflow-hidden rounded-[24px] border border-[#d8e8f4] bg-white text-[#083d78] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#e5eef5] px-5 py-4">
            <div>
              <h2 className="text-lg font-black">Notifications</h2>
              <p className="text-xs font-semibold text-[#7890a7]">{unread ? `${unread} unread` : "All caught up"}</p>
            </div>
            <button type="button" onClick={markAllRead} disabled={busy || unread === 0} className="inline-flex items-center gap-1.5 rounded-xl bg-[#eef7ff] px-3 py-2 text-xs font-black text-[#197fe9] disabled:cursor-not-allowed disabled:opacity-40"><CheckCheck size={15} /> Mark all read</button>
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-10 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#eef8ff] text-[#197fe9]"><Bell size={30} /></div><h3 className="mt-4 font-black">No notifications yet</h3><p className="mt-1 text-sm font-semibold text-[#7890a7]">Important learner updates will appear here.</p></div>
          ) : (
            <div className="max-h-[430px] overflow-y-auto">
              {items.map((item) => {
                const content = (
                  <div className={`flex gap-3 px-5 py-4 transition hover:bg-[#f7fbff] ${item.is_read ? "bg-white" : "bg-[#f0f8ff]"}`}>
                    <div className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${item.is_read ? "bg-[#edf3f8]" : "bg-[#dff1ff]"}`}>{item.type.startsWith("buddy") ? "🏆" : item.type === "achievement" ? "🏅" : "🔔"}</div>
                    <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className={`text-sm ${item.is_read ? "font-bold" : "font-black"}`}>{item.title}</p>{!item.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />}</div><p className="mt-1 text-xs font-semibold leading-5 text-[#6685a4]">{item.message}</p><p className="mt-1.5 text-[10px] font-black uppercase tracking-wide text-[#9aabba]">{relativeTime(item.created_at)}</p></div>
                    {item.link && <ChevronRight size={17} className="mt-3 shrink-0 text-[#9bb0c3]" />}
                  </div>
                );
                return item.link ? <Link key={item.id} href={item.link} onClick={() => void openNotification(item)}>{content}</Link> : <button key={item.id} type="button" className="block w-full text-left" onClick={() => void openNotification(item)}>{content}</button>;
              })}
            </div>
          )}

          <Link href="/notifications" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 border-t border-[#e5eef5] px-5 py-3.5 text-sm font-black text-[#197fe9] hover:bg-[#f7fbff]">View all notifications <ChevronRight size={16} /></Link>
        </div>
      )}
    </div>
  );
}
