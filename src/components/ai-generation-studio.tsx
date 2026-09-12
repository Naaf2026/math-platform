"use client";

import { useEffect, useState } from "react";
import { Bot, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { generateAIQuestions, listGenerationJobs } from "@/lib/ai-generation-studio";

const TYPES = ["multiple_choice", "number_input", "true_false", "ordering", "drag_drop", "number_line", "manipulatives"];

export default function AIGenerationStudio() {
  const [grade, setGrade] = useState(4); const [age, setAge] = useState(9); const [count, setCount] = useState(10);
  const [bookId, setBookId] = useState(""); const [chapterId, setChapterId] = useState(""); const [objectiveId, setObjectiveId] = useState("");
  const [difficulty, setDifficulty] = useState("adaptive"); const [types, setTypes] = useState<string[]>(["multiple_choice"]);
  const [jobs, setJobs] = useState<any[]>([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");

  const refresh = async () => { try { setJobs(await listGenerationJobs()); } catch (e) { setMessage(e instanceof Error ? e.message : "Could not load generation history."); } };
  useEffect(() => { void refresh(); }, []);
  const toggle = (type: string) => setTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  const generate = async () => {
    if (!bookId.trim()) { setMessage("Enter the indexed book ID before generating."); return; }
    if (!types.length) { setMessage("Select at least one question type."); return; }
    setBusy(true); setMessage("");
    try { const result = await generateAIQuestions({ grade, age, count, book_id: bookId.trim(), chapter_id: chapterId.trim() || null, objective_id: objectiveId.trim() || null, difficulty: difficulty as any, question_types: types }); setMessage(`Generated ${result.count} questions successfully. They are pending validation/review.`); await refresh(); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Generation failed."); }
    finally { setBusy(false); }
  };

  return <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-violet-600"><Sparkles size={15}/> AI Generation Studio</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Generate curriculum-aligned questions</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Generate a batch from an indexed book, chapter and learning objective. Every generated question enters the validation workflow before publication.</p></div><Bot className="text-violet-200" size={42}/></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Indexed book ID" value={bookId} onChange={setBookId} placeholder="Book UUID"/><Field label="Chapter ID (optional)" value={chapterId} onChange={setChapterId} placeholder="Chapter UUID"/><Field label="Learning objective ID" value={objectiveId} onChange={setObjectiveId} placeholder="Objective UUID"/><NumberField label="Grade" value={grade} onChange={setGrade}/><NumberField label="Age" value={age} onChange={setAge}/><NumberField label="Question count" value={count} onChange={setCount}/><label className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-black">Difficulty<select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold"><option>adaptive</option><option>easy</option><option>medium</option><option>hard</option></select></label></div>
    <div className="mt-5"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Interaction types</p><div className="mt-2 flex flex-wrap gap-2">{TYPES.map((type) => <button key={type} onClick={() => toggle(type)} className={`rounded-full px-3 py-2 text-xs font-black transition ${types.includes(type) ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>{type.replaceAll("_", " ")}</button>)}</div></div>
    <button disabled={busy} onClick={generate} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white shadow-lg disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>} {busy ? "Generating…" : "Generate questions"}</button>
    {message && <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">{message}</div>}
    <div className="mt-8 border-t border-slate-100 pt-6"><h3 className="font-black text-[#071b3a]">Generation history</h3><div className="mt-3 space-y-2">{jobs.length ? jobs.map((job) => <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"><div><p className="text-sm font-black text-slate-700">Grade {job.grade} · {job.requested_count} requested</p><p className="text-xs text-slate-500">{job.status} · {job.model || "AI model"} · {job.created_at ? new Date(job.created_at).toLocaleString() : ""}</p></div><span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black"><CheckCircle2 size={14}/> {job.generated_count ?? 0} generated</span></div>) : <p className="text-sm text-slate-400">No generation jobs yet.</p>}</div></div>
  </section>;
}
function Field({ label, value, onChange, placeholder }: { label:string; value:string; onChange:(v:string)=>void; placeholder:string }) { return <label className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-black">{label}<input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold outline-none focus:border-violet-300"/></label>; }
function NumberField({ label, value, onChange }: { label:string; value:number; onChange:(v:number)=>void }) { return <label className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-black">{label}<input type="number" value={value} onChange={(e)=>onChange(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold"/></label>; }
