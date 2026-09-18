"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit3, Gamepad2, Plus, RefreshCw, Save, ShieldCheck, Sparkles, Trash2, Trophy, X, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/app/auth/role-router";

type Game = {
  game_key: string;
  title: string;
  play_cost: number;
  completion_reward_min: number;
  completion_reward_max: number;
  active: boolean;
  aliases: string[];
};

const blank: Game = {
  game_key: "",
  title: "",
  play_cost: 3,
  completion_reward_min: 0,
  completion_reward_max: 6,
  active: true,
  aliases: [],
};

export default function AdminMindGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [form, setForm] = useState<Game>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading Mind Games…");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const supabase = createClient();

  async function load() {
    if (!supabase) { setStatus("Supabase is not configured."); return; }
    setStatus("Loading Mind Games…");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { window.location.href = "/login"; return; }
    const role = await getUserRole(supabase, user.id);
    if (role !== "admin") { setStatus("Administrator access is required."); return; }

    const { data, error } = await supabase.from("brain_game_catalog").select("*").order("title");
    if (error) { setStatus(error.message); return; }
    setGames((data ?? []) as Game[]);
    setStatus("");
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games.filter((g) => !q || g.title.toLowerCase().includes(q) || g.game_key.toLowerCase().includes(q));
  }, [games, query]);

  function openNew() {
    setEditing(null);
    setForm({ ...blank });
    setShowForm(true);
  }

  function openEdit(game: Game) {
    setEditing(game.game_key);
    setForm({ ...game, aliases: [...(game.aliases ?? [])] });
    setShowForm(true);
  }

  async function save() {
    if (!supabase) return;
    const key = form.game_key.trim().toLowerCase();
    const title = form.title.trim();
    if (!key || !title) { setStatus("Game key and title are required."); return; }
    if (!/^[a-z0-9-]+$/.test(key)) { setStatus("Game key can contain only lowercase letters, numbers and hyphens."); return; }
    if (form.play_cost < 0 || form.completion_reward_min < 0 || form.completion_reward_max < form.completion_reward_min) {
      setStatus("Check the Mind Sparks cost and reward range."); return;
    }

    setSaving(true); setStatus("");
    const payload = {
      game_key: key,
      title,
      play_cost: Math.round(form.play_cost),
      completion_reward_min: Math.round(form.completion_reward_min),
      completion_reward_max: Math.round(form.completion_reward_max),
      active: form.active,
      aliases: form.aliases.map((a) => a.trim()).filter(Boolean),
    };

    const result = editing
      ? await supabase.from("brain_game_catalog").update(payload).eq("game_key", editing)
      : await supabase.from("brain_game_catalog").insert(payload);

    if (result.error) { setStatus(result.error.message); setSaving(false); return; }
    setSaving(false); setShowForm(false); setEditing(null); setForm({ ...blank }); await load();
  }

  async function toggle(game: Game) {
    if (!supabase) return;
    const { error } = await supabase.from("brain_game_catalog").update({ active: !game.active }).eq("game_key", game.game_key);
    if (error) { setStatus(error.message); return; }
    await load();
  }

  async function remove(game: Game) {
    if (!supabase) return;
    if (!window.confirm(`Delete “${game.title}” from the Mind Games catalog? Existing game sessions will remain.`)) return;
    const { error } = await supabase.from("brain_game_catalog").delete().eq("game_key", game.game_key);
    if (error) { setStatus(error.message); return; }
    await load();
  }

  if (status && games.length === 0) {
    return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6"><div className="mx-auto mt-24 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl ring-1 ring-slate-100"><ShieldCheck className="mx-auto text-violet-600" size={48}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Mind Games Management</h1><p className="mt-3 text-sm leading-6 text-slate-500">{status}</p><Link href="/admin" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white"><ArrowLeft size={17}/> Admin Dashboard</Link></div></main>;
  }

  const activeCount = games.filter((g) => g.active).length;
  const totalCost = games.reduce((sum, g) => sum + g.play_cost, 0);

  return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-24 sm:p-8">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/admin" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Admin Dashboard</Link>
        <div className="flex flex-wrap gap-2">
          <Link href="/brain-games" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-slate-200">View Mind Games</Link>
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600"><RefreshCw size={16}/> Refresh</button>
          <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-violet-200"><Plus size={17}/> Add Game</button>
        </div>
      </header>

      <section className="mt-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-fuchsia-600 p-7 text-white shadow-2xl sm:p-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><ShieldCheck size={14}/> Admin control centre</div><h1 className="mt-4 text-4xl font-black sm:text-5xl">Mind Games Management</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base">Control the live Mind Games catalog, Mind Sparks cost, completion rewards, aliases and availability used by the student game system.</p></div>
          <div className="grid grid-cols-3 gap-3">
            <Summary icon={<Gamepad2/>} value={games.length} label="Games"/>
            <Summary icon={<Zap/>} value={activeCount} label="Active"/>
            <Summary icon={<Sparkles/>} value={totalCost} label="Total cost"/>
          </div>
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Game catalog</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Manage every Mind Game</h2></div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search games…" className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none ring-violet-200 focus:ring-2 sm:w-80"/>
      </section>

      {status && <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{status}</div>}

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((game) => <article key={game.game_key} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className={`h-2 ${game.active ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-slate-300"}`}/>
          <div className="p-6">
            <div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-violet-700">{game.game_key}</span><h3 className="mt-3 text-2xl font-black text-[#071b3a]">{game.title}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-black ${game.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{game.active ? "ACTIVE" : "OFF"}</span></div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Info label="Play cost" value={`${game.play_cost} MS`} />
              <Info label="Min reward" value={String(game.completion_reward_min)} />
              <Info label="Max reward" value={String(game.completion_reward_max)} />
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-3"><p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Aliases</p><p className="mt-1 text-xs font-semibold text-slate-600">{(game.aliases ?? []).length ? game.aliases.join(" · ") : "None"}</p></div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <button onClick={() => openEdit(game)} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2.5 text-sm font-black text-violet-700"><Edit3 size={15}/> Edit</button>
              <button onClick={() => void toggle(game)} className={`rounded-xl px-3 py-2.5 text-sm font-black ${game.active ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{game.active ? "Disable" : "Enable"}</button>
              <button onClick={() => void remove(game)} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-black text-red-600"><Trash2 size={15}/> Delete</button>
            </div>
          </div>
        </article>)}
      </section>

      {filtered.length === 0 && <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100"><Gamepad2 className="mx-auto text-violet-500" size={38}/><h3 className="mt-3 text-xl font-black">No games found</h3></div>}

      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(e) => { if (e.currentTarget === e.target) setShowForm(false); }}>
        <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">{editing ? "Edit game" : "New game"}</p><h2 className="mt-1 text-3xl font-black text-[#071b3a]">{editing ? "Edit Mind Game" : "Add Mind Game"}</h2></div><button onClick={() => setShowForm(false)} className="rounded-xl bg-slate-100 p-2 text-slate-500"><X/></button></div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <Field label="Game key" value={form.game_key} disabled={!!editing} onChange={(v) => setForm({ ...form, game_key: v })} placeholder="example-game"/>
            <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Game title"/>
            <Field label="Mind Sparks play cost" type="number" value={String(form.play_cost)} onChange={(v) => setForm({ ...form, play_cost: Number(v) })}/>
            <Field label="Minimum completion reward" type="number" value={String(form.completion_reward_min)} onChange={(v) => setForm({ ...form, completion_reward_min: Number(v) })}/>
            <Field label="Maximum completion reward" type="number" value={String(form.completion_reward_max)} onChange={(v) => setForm({ ...form, completion_reward_max: Number(v) })}/>
            <Field label="Aliases" value={(form.aliases ?? []).join(", ")} onChange={(v) => setForm({ ...form, aliases: v.split(",").map((x) => x.trim()).filter(Boolean) })} placeholder="old-key, alternate-key"/>
          </div>
          <label className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-5 accent-violet-600"/> Available to students</label>
          <div className="mt-7 flex justify-end gap-3"><button onClick={() => setShowForm(false)} className="rounded-xl bg-slate-100 px-5 py-3 font-black text-slate-600">Cancel</button><button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-50"><Save size={17}/>{saving ? "Saving…" : "Save Game"}</button></div>
        </section>
      </div>}
    </div>
  </main>;
}

function Summary({icon,value,label}:{icon:React.ReactNode;value:number;label:string}) { return <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur"><div className="flex justify-center text-yellow-300">{icon}</div><p className="mt-1 text-2xl font-black">{value}</p><p className="text-[11px] font-bold text-violet-100">{label}</p></div>; }
function Info({label,value}:{label:string;value:string}) { return <div className="rounded-2xl bg-slate-50 p-3 text-center"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-[#071b3a]">{value}</p></div>; }
function Field({label,value,onChange,placeholder,type="text",disabled=false}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;type?:string;disabled?:boolean}) { return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span><input disabled={disabled} type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 font-semibold outline-none focus:ring-2 focus:ring-violet-200 disabled:bg-slate-100"/></label>; }
