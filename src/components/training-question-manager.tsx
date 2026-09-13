"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Plus, Save, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/app/auth/role-router";

const grades = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7"];
const difficulties = ["easy","medium","hard"];
const questionTypes = ["multiple_choice","number_input","short_answer","true_false","ordering","drag_drop","number_line","manipulatives"];
type Topic = { id: string; title: string; grade_level: string };
type Row = { id: string; grade_level: string; topic_id: string; skill: string; prompt: string; answer: string; explanation: string; difficulty: string; question_type: string; options: string[]; status: string };

const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-violet-400";

export default function TrainingQuestionManager() {
  const supabase = createClient();
  const [role, setRole] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [grade, setGrade] = useState("Grade 3");
  const [topicId, setTopicId] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [skill, setSkill] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [questionType, setQuestionType] = useState("multiple_choice");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [options, setOptions] = useState(["","","",""]);
  const [explanation, setExplanation] = useState("");
  const [hint, setHint] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const gradeTopics = useMemo(() => topics.filter(t => t.grade_level === grade), [topics, grade]);

  useEffect(() => {
    void (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const r = await getUserRole(supabase, user.id);
      setRole(r);
      if (r !== "teacher" && r !== "admin") { setMessage("Teacher or administrator access is required."); setLoading(false); return; }
      await load();
      setLoading(false);
    })();
  }, []);

  async function load() {
    if (!supabase) return;
    const [{ data: ts }, { data: qs }] = await Promise.all([
      supabase.from("learning_topics").select("id,title,grade_level").order("grade_level").order("sort_order"),
      supabase.from("learning_questions").select("id,grade_level,topic_id,skill,prompt,answer,explanation,difficulty,question_type,options,status").order("updated_at", { ascending: false }).limit(300),
    ]);
    setTopics((ts ?? []) as Topic[]);
    setRows((qs ?? []).map((q: any) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] })) as Row[]);
  }

  function reset() {
    setSelectedId(""); setTopicId(""); setTopicTitle(""); setSkill(""); setDifficulty("easy"); setQuestionType("multiple_choice"); setPrompt(""); setAnswer(""); setOptions(["","","",""]); setExplanation(""); setHint(""); setMessage("");
  }

  function selectQuestion(q: Row) {
    setSelectedId(q.id); setGrade(q.grade_level); setTopicId(q.topic_id); setTopicTitle(topics.find(t => t.id === q.topic_id)?.title ?? ""); setSkill(q.skill ?? ""); setDifficulty(q.difficulty ?? "easy"); setQuestionType(q.question_type ?? "multiple_choice"); setPrompt(q.prompt ?? ""); setAnswer(q.answer ?? ""); setOptions(q.options.length ? [...q.options, "", "", ""].slice(0,4) : ["","","",""]); setExplanation(q.explanation ?? ""); setHint(""); setMessage("");
  }

  async function save(publish = false) {
    if (!supabase) return;
    if (!topicId && !topicTitle.trim()) { setMessage("Select an existing topic or enter a new topic name."); return; }
    if (!prompt.trim() || !answer.trim()) { setMessage("Question and answer are required."); return; }
    setMessage("Saving…");
    const { data, error } = await supabase.rpc("save_training_question", {
      p_id: selectedId || null,
      p_grade_level: grade,
      p_topic_id: topicId || null,
      p_topic_title: topicTitle.trim() || null,
      p_skill: skill.trim() || "General",
      p_prompt: prompt.trim(),
      p_answer: answer.trim(),
      p_explanation: explanation.trim(),
      p_difficulty: difficulty,
      p_question_type: questionType,
      p_options: options.map(v => v.trim()).filter(Boolean),
      p_interaction_config: {},
      p_hint: hint.trim() || null,
    });
    if (error) { setMessage(error.message); return; }
    const id = String(data);
    setSelectedId(id);
    if (publish) {
      const { error: publishError } = await supabase.rpc("publish_training_question", { p_id: id });
      if (publishError) { setMessage(`Saved draft, but publishing failed: ${publishError.message}`); await load(); return; }
      setMessage(`Published for ${grade}. Learners selecting ${grade} will receive this question set.`);
    } else setMessage(`Saved as draft for ${grade}.`);
    await load();
  }

  if (loading) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-6xl rounded-3xl bg-white p-10 text-center font-bold">Loading Training Question Bank…</div></main>;
  if (!role || (role !== "teacher" && role !== "admin")) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center font-bold">{message}</div></main>;

  return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-24 sm:p-8"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><Link href={role === "admin" ? "/admin" : "/teacher"} className="text-sm font-black text-violet-600">← {role === "admin" ? "Admin" : "Teacher"} Dashboard</Link><h1 className="mt-2 flex items-center gap-3 text-3xl font-black text-[#071b3a]"><BookOpen className="text-violet-600"/> Training Question Bank</h1><p className="mt-1 text-sm text-slate-500">Assign every question to a Grade, Topic, Skill and Difficulty. Only published questions are delivered to learners.</p></div><button onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-black text-white"><Plus size={18}/> New question</button></header>
    {message && <div className="mt-5 flex items-center gap-2 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-800"><CheckCircle2 size={17}/>{message}</div>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Published / draft questions</p><div className="mt-4 space-y-2">{rows.map(q => <button key={q.id} onClick={() => selectQuestion(q)} className={`w-full rounded-2xl border p-3 text-left ${selectedId === q.id ? "border-violet-300 bg-violet-50" : "border-slate-100 hover:bg-slate-50"}`}><div className="flex justify-between gap-2"><span className="line-clamp-2 text-sm font-black">{q.prompt}</span><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase">{q.status}</span></div><p className="mt-2 text-[11px] font-bold text-slate-500">{q.grade_level} · {q.skill}</p></button>)}{rows.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No database questions yet.</p>}</div></aside>
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-black">Grade<select className={input} value={grade} onChange={e => { setGrade(e.target.value); setTopicId(""); setTopicTitle(""); }}><option>{grades[0]}</option>{grades.slice(1).map(g => <option key={g}>{g}</option>)}</select></label><label className="text-sm font-black">Topic<select className={input} value={topicId} onChange={e => { setTopicId(e.target.value); const t=gradeTopics.find(x=>x.id===e.target.value); setTopicTitle(t?.title ?? ""); }}><option value="">Create/select topic below</option>{gradeTopics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label className="text-sm font-black sm:col-span-2">New topic name<input className={input} value={topicTitle} onChange={e => { setTopicTitle(e.target.value); if (topicId) setTopicId(""); }} placeholder={`Example: Numbers for ${grade}`}/></label><label className="text-sm font-black">Skill<input className={input} value={skill} onChange={e=>setSkill(e.target.value)} placeholder="Example: Place value"/></label><label className="text-sm font-black">Difficulty<select className={input} value={difficulty} onChange={e=>setDifficulty(e.target.value)}>{difficulties.map(d=><option key={d}>{d}</option>)}</select></label><label className="text-sm font-black">Question type<select className={input} value={questionType} onChange={e=>setQuestionType(e.target.value)}>{questionTypes.map(t=><option key={t}>{t.replaceAll("_"," ")}</option>)}</select></label><label className="text-sm font-black">Correct answer<input className={input} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Correct answer"/></label><label className="text-sm font-black sm:col-span-2">Question<textarea className={`${input} min-h-28`} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={`Write the ${grade} mathematics question…`}/></label><div className="sm:col-span-2"><p className="text-sm font-black">Answer options</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map((v,i)=><input key={i} className={input} value={v} onChange={e=>setOptions(o=>o.map((x,j)=>j===i?e.target.value:x))} placeholder={`Option ${i+1}`}/>)}</div></div><label className="text-sm font-black sm:col-span-2">Explanation<textarea className={`${input} min-h-24`} value={explanation} onChange={e=>setExplanation(e.target.value)} placeholder="Explain the correct method…"/></label><label className="text-sm font-black sm:col-span-2">Hint<textarea className={`${input} min-h-20`} value={hint} onChange={e=>setHint(e.target.value)} placeholder="Optional hint…"/></label></div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5"><button onClick={()=>void save(false)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white"><Save size={17}/> Save Draft</button><button onClick={()=>void save(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"><Send size={17}/> Save & Publish</button></div>
      </section>
    </div>
  </div></main>;
}
