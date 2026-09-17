"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, ChevronDown, ChevronRight, FileQuestion, Plus, Save, Search, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/app/auth/role-router";

const grades = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7"];
const difficulties = ["easy","medium","hard"];
const questionTypes = ["multiple_choice","number_input","short_answer","true_false","ordering","drag_drop","number_line","manipulatives"];
type Topic = { id: string; title: string; grade_level: string };
type Row = { id: string; grade_level: string; topic_id: string; skill: string; prompt: string; answer: string; explanation: string; difficulty: string; question_type: string; options: string[]; status: string };
type Book = { id: string; title: string; subject: string; grade: number | null };
type Chapter = { id: string; book_id: string; chapter_number: number | null; title: string };
type AiRow = { id: string; grade: number | null; book_id: string | null; chapter_id: string | null; topic: string | null; skill: string | null; prompt: string; difficulty: string | null; question_type: string | null; validation_status: string | null };

const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-violet-400";

export default function TrainingQuestionManager() {
  const supabase = createClient();
  const [role, setRole] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [aiRows, setAiRows] = useState<AiRow[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
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
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [openGrades, setOpenGrades] = useState<Record<number, boolean>>({});
  const [openBooks, setOpenBooks] = useState<Record<string, boolean>>({});
  const [showManualEditor, setShowManualEditor] = useState(false);

  const gradeTopics = useMemo(() => topics.filter(t => t.grade_level === grade), [topics, grade]);

  const filteredAiRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return aiRows.filter(q => {
      if (selectedGrade !== null && q.grade !== selectedGrade) return false;
      if (selectedBook !== null && q.book_id !== selectedBook) return false;
      if (selectedChapter !== null && q.chapter_id !== selectedChapter) return false;
      if (!term) return true;
      return [q.prompt, q.topic, q.skill, q.difficulty, q.question_type].filter(Boolean).some(v => String(v).toLowerCase().includes(term));
    });
  }, [aiRows, search, selectedGrade, selectedBook, selectedChapter]);

  const visibleBooks = useMemo(() => selectedGrade === null ? books : books.filter(b => b.grade === selectedGrade), [books, selectedGrade]);
  const visibleChapters = useMemo(() => selectedBook === null ? [] : chapters.filter(c => c.book_id === selectedBook).sort((a,b) => (a.chapter_number ?? 999) - (b.chapter_number ?? 999)), [chapters, selectedBook]);

  function bookQuestionCount(bookId: string) { return aiRows.filter(q => q.book_id === bookId && (selectedGrade === null || q.grade === selectedGrade)).length; }
  function chapterQuestionCount(chapterId: string) { return aiRows.filter(q => q.chapter_id === chapterId).length; }
  function gradeQuestionCount(g: number) { return aiRows.filter(q => q.grade === g).length; }

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
    const [{ data: ts }, { data: qs }, { data: bs }, { data: cs }, { data: ais }] = await Promise.all([
      supabase.from("learning_topics").select("id,title,grade_level").order("grade_level").order("sort_order"),
      supabase.from("learning_questions").select("id,grade_level,topic_id,skill,prompt,answer,explanation,difficulty,question_type,options,status").order("updated_at", { ascending: false }).limit(300),
      supabase.from("books").select("id,title,subject,grade").eq("is_active", true).order("grade").order("title"),
      supabase.from("book_chapters").select("id,book_id,chapter_number,title").order("chapter_number"),
      supabase.from("ai_generated_questions").select("id,grade,book_id,chapter_id,topic,skill,prompt,difficulty,question_type,validation_status").order("grade").order("created_at", { ascending: false }).limit(1000),
    ]);
    setTopics((ts ?? []) as Topic[]);
    setRows((qs ?? []).map((q: any) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] })) as Row[]);
    setBooks((bs ?? []) as Book[]);
    setChapters((cs ?? []) as Chapter[]);
    setAiRows((ais ?? []) as AiRow[]);
  }

  function reset() {
    setSelectedId(""); setTopicId(""); setTopicTitle(""); setSkill(""); setDifficulty("easy"); setQuestionType("multiple_choice"); setPrompt(""); setAnswer(""); setOptions(["","","",""]); setExplanation(""); setHint(""); setMessage(""); setShowManualEditor(true);
  }

  function selectQuestion(q: Row) {
    setSelectedId(q.id); setGrade(q.grade_level); setTopicId(q.topic_id); setTopicTitle(topics.find(t => t.id === q.topic_id)?.title ?? ""); setSkill(q.skill ?? ""); setDifficulty(q.difficulty ?? "easy"); setQuestionType(q.question_type ?? "multiple_choice"); setPrompt(q.prompt ?? ""); setAnswer(q.answer ?? ""); setOptions(q.options.length ? [...q.options, "", "", ""].slice(0,4) : ["","","",""]); setExplanation(q.explanation ?? ""); setHint(""); setMessage(""); setShowManualEditor(true);
  }

  async function save(publish = false) {
    if (!supabase) return;
    if (!topicId && !topicTitle.trim()) { setMessage("Select an existing topic or enter a new topic name."); return; }
    if (!prompt.trim() || !answer.trim()) { setMessage("Question and answer are required."); return; }
    setMessage("Saving…");
    const { data, error } = await supabase.rpc("save_training_question", {
      p_id: selectedId || null, p_grade_level: grade, p_topic_id: topicId || null, p_topic_title: topicTitle.trim() || null,
      p_skill: skill.trim() || "General", p_prompt: prompt.trim(), p_answer: answer.trim(), p_explanation: explanation.trim(),
      p_difficulty: difficulty, p_question_type: questionType, p_options: options.map(v => v.trim()).filter(Boolean),
      p_interaction_config: {}, p_hint: hint.trim() || null,
    });
    if (error) { setMessage(error.message); return; }
    const id = String(data); setSelectedId(id);
    if (publish) {
      const { error: publishError } = await supabase.rpc("publish_training_question", { p_id: id });
      if (publishError) { setMessage(`Saved draft, but publishing failed: ${publishError.message}`); await load(); return; }
      setMessage(`Published for ${grade}. Learners selecting ${grade} will receive this question set.`);
    } else setMessage(`Saved as draft for ${grade}.`);
    await load();
  }

  function clearHierarchy() { setSelectedGrade(null); setSelectedBook(null); setSelectedChapter(null); }
  function chooseGrade(g: number) { setSelectedGrade(g); setSelectedBook(null); setSelectedChapter(null); setOpenGrades(v => ({...v,[g]: !v[g]})); }
  function chooseBook(id: string) { setSelectedBook(id); setSelectedChapter(null); setOpenBooks(v => ({...v,[id]: !v[id]})); }
  function chooseChapter(id: string) { setSelectedChapter(id); }

  if (loading) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-7xl rounded-3xl bg-white p-10 text-center font-bold">Loading Question Bank…</div></main>;
  if (!role || (role !== "teacher" && role !== "admin")) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center font-bold">{message}</div></main>;

  return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-4 pb-24 sm:p-6 lg:p-8">
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href={role === "admin" ? "/admin" : "/teacher"} className="text-sm font-black text-violet-600">← {role === "admin" ? "Admin" : "Teacher"} Dashboard</Link>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-black text-[#071b3a] sm:text-3xl"><BookOpen className="text-violet-600"/> Question Bank</h1>
          <p className="mt-1 text-sm text-slate-500">Browse generated questions in a clear <b>Grade → Book → Chapter</b> structure.</p>
        </div>
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-sm"><Plus size={18}/> New manual question</button>
      </header>

      {message && <div className="mt-4 flex items-center gap-2 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-800"><CheckCircle2 size={17}/>{message}</div>}

      <section className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-[220px] flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-violet-400" placeholder="Search questions, topics or skills…"/></div>
          <button onClick={clearHierarchy} className={`rounded-xl px-3 py-2.5 text-xs font-black ${selectedGrade===null ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>All questions</button>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-500">{filteredAiRows.length} questions</div>
        </div>

        <div className="grid min-h-[560px] lg:grid-cols-[260px_290px_1fr]">
          <aside className="border-b border-slate-100 bg-slate-50/70 p-3 lg:border-b-0 lg:border-r">
            <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">1 · Grade</div>
            <div className="space-y-1">{grades.map(g => { const n=Number(g.replace("Grade ","")); const active=selectedGrade===n; return <button key={g} onClick={()=>chooseGrade(n)} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-black transition ${active ? "bg-violet-600 text-white" : "text-slate-700 hover:bg-white"}`}><span className="flex items-center gap-2">{openGrades[n] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>} {g}</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>{gradeQuestionCount(n)}</span></button>; })}</div>
          </aside>

          <aside className="border-b border-slate-100 p-3 lg:border-b-0 lg:border-r">
            <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">2 · Book</div>
            {selectedGrade===null ? <div className="px-3 py-10 text-center text-xs font-semibold text-slate-400">Select a grade to see its books.</div> : visibleBooks.length===0 ? <div className="px-3 py-10 text-center text-xs font-semibold text-slate-400">No books for this grade.</div> : <div className="space-y-1">{visibleBooks.map(b=>{const active=selectedBook===b.id; return <button key={b.id} onClick={()=>chooseBook(b.id)} className={`w-full rounded-xl px-3 py-3 text-left transition ${active ? "bg-violet-50 ring-1 ring-violet-200" : "hover:bg-slate-50"}`}><div className="flex items-center gap-2"><BookOpen size={16} className={active ? "text-violet-600" : "text-slate-400"}/><span className="min-w-0 flex-1 truncate text-sm font-black text-slate-800">{b.title}</span>{openBooks[b.id] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</div><div className="mt-1 pl-6 text-[10px] font-bold text-slate-400">{b.subject} · {bookQuestionCount(b.id)} questions</div></button>})}</div>}
          </aside>

          <section className="min-w-0 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div><div className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">3 · Chapter & Questions</div><div className="mt-1 text-lg font-black text-slate-800">{selectedChapter ? (chapters.find(c=>c.id===selectedChapter)?.title ?? "Chapter") : selectedBook ? (books.find(b=>b.id===selectedBook)?.title ?? "Book") : selectedGrade ? `Grade ${selectedGrade}` : "All generated questions"}</div></div>
              {selectedBook && <div className="flex max-w-full gap-2 overflow-x-auto pb-1">{visibleChapters.map(c=>{const active=selectedChapter===c.id; return <button key={c.id} onClick={()=>chooseChapter(c.id)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Ch. {c.chapter_number ?? "–"} · {c.title} <span className="ml-1 opacity-70">{chapterQuestionCount(c.id)}</span></button>})}</div>}
            </div>

            {filteredAiRows.length===0 ? <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center"><FileQuestion size={42} className="text-slate-300"/><p className="mt-3 font-black text-slate-600">No questions in this selection</p><p className="mt-1 text-xs text-slate-400">Choose another grade, book or chapter, or clear the filters.</p></div> : <div className="grid gap-3">{filteredAiRows.map((q,i)=> <div key={q.id} className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-violet-200 hover:shadow-sm"><div className="flex items-start gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-black text-violet-600">{i+1}</div><div className="min-w-0 flex-1"><p className="text-sm font-black leading-6 text-slate-800">{q.prompt}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">{q.topic || "General"}</span><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600">{q.skill || "General skill"}</span><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">{q.difficulty || "—"}</span><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{q.validation_status || "pending"}</span><span className="text-[10px] font-bold text-slate-400">{q.question_type?.replaceAll("_"," ")}</span></div></div></div></div>)}</div>}
          </section>
        </div>
      </section>

      {showManualEditor && <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"><div><h2 className="text-xl font-black text-slate-800">Manual Question Editor</h2><p className="mt-1 text-xs text-slate-500">Existing manual question creation remains available separately from the organized textbook bank.</p></div><button onClick={()=>setShowManualEditor(false)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">Close editor</button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-black">Grade<select className={input} value={grade} onChange={e=>{setGrade(e.target.value);setTopicId("");setTopicTitle("")}}>{grades.map(g=><option key={g}>{g}</option>)}</select></label><label className="text-sm font-black">Topic<select className={input} value={topicId} onChange={e=>{setTopicId(e.target.value);const t=gradeTopics.find(x=>x.id===e.target.value);setTopicTitle(t?.title??"")}}><option value="">Create/select topic below</option>{gradeTopics.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label className="text-sm font-black sm:col-span-2">New topic name<input className={input} value={topicTitle} onChange={e=>{setTopicTitle(e.target.value);if(topicId)setTopicId("")}} placeholder={`Example: Numbers for ${grade}`}/></label><label className="text-sm font-black">Skill<input className={input} value={skill} onChange={e=>setSkill(e.target.value)} placeholder="Example: Place value"/></label><label className="text-sm font-black">Difficulty<select className={input} value={difficulty} onChange={e=>setDifficulty(e.target.value)}>{difficulties.map(d=><option key={d}>{d}</option>)}</select></label><label className="text-sm font-black">Question type<select className={input} value={questionType} onChange={e=>setQuestionType(e.target.value)}>{questionTypes.map(t=><option key={t}>{t.replaceAll("_"," ")}</option>)}</select></label><label className="text-sm font-black">Correct answer<input className={input} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Correct answer"/></label><label className="text-sm font-black sm:col-span-2">Question<textarea className={`${input} min-h-28`} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={`Write the ${grade} mathematics question…`}/></label><div className="sm:col-span-2"><p className="text-sm font-black">Answer options</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map((v,i)=><input key={i} className={input} value={v} onChange={e=>setOptions(o=>o.map((x,j)=>j===i?e.target.value:x))} placeholder={`Option ${i+1}`}/>)}</div></div><label className="text-sm font-black sm:col-span-2">Explanation<textarea className={`${input} min-h-24`} value={explanation} onChange={e=>setExplanation(e.target.value)} placeholder="Explain the correct method…"/></label><label className="text-sm font-black sm:col-span-2">Hint<textarea className={`${input} min-h-20`} value={hint} onChange={e=>setHint(e.target.value)} placeholder="Optional hint…"/></label></div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5"><button onClick={()=>void save(false)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white"><Save size={17}/> Save Draft</button><button onClick={()=>void save(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"><Send size={17}/> Save & Publish</button></div>
      </section>}
    </div>
  </main>;
}
