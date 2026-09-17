"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, GripVertical, Loader2, X, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type BankQuestion = { id: string; prompt: string; options: unknown; answer: string; explanation: string | null; difficulty: string | null; question_type: string | null };
type Option = { id?: string; text?: string; label?: string; group?: string; target?: string; value?: string };
type DragItem = { id: string; text: string; group: string };

function normalizeGrade(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return `Grade ${raw}`;
  return raw.toLowerCase().startsWith("grade ") ? `Grade ${raw.slice(6).trim()}` : raw;
}
function getOptions(question: BankQuestion): Option[] {
  return Array.isArray(question.options) ? question.options as Option[] : [];
}
function textOf(o: Option, fallback = "") { return String(o.text ?? o.label ?? o.value ?? o.id ?? fallback); }
function parts(value: unknown) { return String(value ?? "").split(/\s*(?:\||→|->|=>)\s*/).map(s => s.trim()).filter(Boolean); }
function parseOrder(question: BankQuestion) {
  const opts = getOptions(question).map((o,i) => textOf(o, String(i + 1))).filter(Boolean);
  const ans = parts(question.answer);
  return ans.length > 1 ? ans : opts;
}
function same(a: string, b: string) { return a.trim().toLowerCase() === b.trim().toLowerCase(); }
function parseDrag(question: BankQuestion) {
  const opts = getOptions(question);
  const items: DragItem[] = [];
  const groups = new Set<string>();
  opts.forEach((o,i) => {
    const id = String(o.id ?? `item-${i}`);
    const text = textOf(o, id);
    const group = String(o.group ?? o.target ?? "Unsorted");
    items.push({ id, text, group }); groups.add(group);
  });
  if (!items.length) {
    const raw = String(question.answer ?? "");
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) parsed.forEach((x:any,i:number) => { const text=String(x.item??x.text??x.value??""); const group=String(x.group??x.target??"Unsorted"); if(text){items.push({id:`item-${i}`,text,group});groups.add(group);} });
      else Object.entries(parsed ?? {}).forEach(([k,v],i) => { const text=String(k); const group=String(v); items.push({id:`item-${i}`,text,group});groups.add(group); });
    } catch {}
  }
  if (!items.length) return null;
  return { items, groups: [...groups] };
}

export default function NumberSchoolModal({ onClose }: { onClose: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [grade, setGrade] = useState<string | null>(null);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [complete, setComplete] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [dragMap, setDragMap] = useState<Record<string,string>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [touchPick, setTouchPick] = useState<string | null>(null);

  async function loadQuestions() {
    setLoading(true); setError(""); setComplete(false); setIndex(0); setScore(0); setSelected(null); setInput(""); setFeedback(null); setOrder([]); setDragMap({});
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) { setError("Please sign in to open Number School."); setLoading(false); return; }
    const { data: profile, error: profileError } = await supabase.from("profiles").select("grade").eq("id", userData.user.id).single();
    if (profileError) { setError("We could not load your grade."); setLoading(false); return; }
    const learnerGrade = normalizeGrade(profile?.grade); setGrade(learnerGrade);
    if (!learnerGrade) { setError("Your grade is not set yet. Please ask your teacher to set your grade."); setLoading(false); return; }
    const { data, error: questionError } = await supabase.from("learning_questions").select("id,prompt,options,answer,explanation,difficulty,question_type").eq("grade_level", learnerGrade).eq("subject", "Mathematics").in("status", ["published", "active"]).limit(50);
    if (questionError) { setError("We could not load the questions for your grade."); setLoading(false); return; }
    const bank = [...(data ?? [])] as BankQuestion[];
    const groups = { hard: bank.filter(q=>q.difficulty==="hard").sort(()=>Math.random()-.5), medium: bank.filter(q=>q.difficulty==="medium").sort(()=>Math.random()-.5), easy: bank.filter(q=>q.difficulty!=="hard"&&q.difficulty!=="medium").sort(()=>Math.random()-.5) };
    const picked = [...groups.hard.slice(0,2), ...groups.medium.slice(0,4), ...groups.easy.slice(0,4)];
    if (picked.length < Math.min(10, bank.length)) for (const q of bank.sort(()=>Math.random()-.5)) if (!picked.some(p=>p.id===q.id)) picked.push(q);
    if (!picked.length) { setError(`No published Mathematics questions are available for ${learnerGrade}.`); setLoading(false); return; }
    setQuestions(picked.slice(0,10)); setLoading(false);
  }
  useEffect(()=>{ void loadQuestions(); }, []);

  const question = questions[index];
  const options = question ? getOptions(question) : [];
  const isOrdering = question?.question_type === "ordering";
  const dragData = question?.question_type === "drag_drop" ? parseDrag(question) : null;
  const isInput = question?.question_type === "number_input" || question?.question_type === "text_input";

  useEffect(()=>{
    if (!question) return;
    if (isOrdering) setOrder(parseOrder(question).sort(()=>Math.random()-.5));
    else setOrder([]);
    setDragMap({}); setDragging(null); setTouchPick(null);
  }, [question?.id, isOrdering]);

  function submit(answer: string) {
    if (!question || feedback) return;
    const normalized=answer.trim().toLowerCase(), correct=String(question.answer??"").trim().toLowerCase();
    const chosen=options.find(o=>same(String(o.id??""),answer)||same(textOf(o),answer));
    const isCorrect=normalized===correct||same(String(chosen?.id??""),question.answer)||same(textOf(chosen??{}),question.answer);
    setSelected(answer); setFeedback(isCorrect?"correct":"wrong"); if(isCorrect)setScore(v=>v+1);
  }
  function submitOrdering(){
    if(!question||feedback||order.length<2)return;
    const correct=parseOrder(question); const ok=order.length===correct.length&&order.every((v,i)=>same(v,correct[i]));
    setFeedback(ok?"correct":"wrong"); if(ok)setScore(v=>v+1);
  }
  function moveOrder(i:number,dir:number){ if(feedback)return; const j=i+dir; if(j<0||j>=order.length)return; const next=[...order]; [next[i],next[j]]=[next[j],next[i]]; setOrder(next); }
  function dropToGroup(item:string,group:string){ if(feedback)return; setDragMap(m=>({...m,[item]:group})); setDragging(null); setTouchPick(null); }
  function submitDragDrop(){
    if(!question||!dragData||feedback)return;
    const ok=dragData.items.every(item=>same(dragMap[item.id]??"",item.group)) && Object.keys(dragMap).length===dragData.items.length;
    setFeedback(ok?"correct":"wrong"); if(ok)setScore(v=>v+1);
  }
  function next(){ if(index>=questions.length-1){setComplete(true);return;} setIndex(v=>v+1);setSelected(null);setInput("");setFeedback(null); }

  return <div className="ns-modal-backdrop" onClick={onClose}>
    <style>{`.ns-special{margin-top:18px}.ns-task-hint{display:flex;gap:8px;align-items:center;background:#f2f6ff;border:1px solid #dbe3ff;border-radius:14px;padding:11px 13px;color:#4c5fb4;font-weight:800;font-size:13px}.ns-order-list{display:grid;gap:10px}.ns-order-item{display:flex;align-items:center;gap:10px;padding:10px;border:2px solid #dce7ef;border-radius:16px;background:#fbfdff;touch-action:none}.ns-order-item.dragging{opacity:.55}.ns-order-num{width:34px;height:34px;border-radius:11px;background:#eaf0f6;display:grid;place-items:center;font-weight:900;color:#526a7e;flex:none}.ns-order-text{flex:1;font-weight:900;font-size:17px}.ns-order-controls{display:flex;gap:5px}.ns-order-controls button{width:38px;height:38px;border:0;border-radius:11px;background:#edf3f8;color:#38536a;font-weight:900;cursor:pointer}.ns-special-check{width:100%;margin-top:12px;border:0;border-radius:15px;padding:14px;background:#3656d4;color:white;font-weight:900;font-size:15px;cursor:pointer}.ns-special-check:disabled{opacity:.5;cursor:not-allowed}.ns-drag-items{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}.ns-drag-chip{border:2px solid #dce7ef;background:white;border-radius:13px;padding:10px 13px;font-weight:900;cursor:grab;touch-action:none}.ns-drag-chip.selected{border-color:#5d68e8;background:#eef0ff}.ns-drop-groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.ns-drop-group{min-height:100px;border:2px dashed #b9c9d7;border-radius:17px;padding:11px;background:#f8fbfd}.ns-drop-group h4{margin:0 0 8px;font-size:13px;color:#526b7f}.ns-drop-group.over{border-color:#5d68e8;background:#f0f2ff}.ns-drop-chip{display:block;background:#fff;border:1px solid #d9e4eb;border-radius:10px;padding:7px 9px;margin-top:6px;font-size:13px;font-weight:800}.ns-feedback.wrong strong{word-break:break-word}@media(max-width:600px){.ns-modal{padding:17px;border-radius:25px}.ns-question-card{padding:18px}.ns-question-card h3{font-size:23px}.ns-options{grid-template-columns:1fr}.ns-order-text{font-size:15px}.ns-order-controls button{width:35px;height:35px}.ns-drop-groups{grid-template-columns:1fr 1fr}}`}</style>
    <section className="ns-modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="number-school-title">
      <button className="ns-modal-close" onClick={onClose} aria-label="Close Number School"><X size={22}/></button>
      {loading ? <div className="ns-loading"><div className="ns-school-mark">🏫</div><Loader2 className="animate-spin" size={30}/><h2>Number School</h2><p>Loading your {grade??"grade-level"} Mathematics lesson…</p></div> : error ? <div className="ns-loading"><div className="ns-school-mark">🏫</div><h2>Number School</h2><p>{error}</p><button className="ns-primary" onClick={()=>void loadQuestions()}>Try Again</button></div> : complete ? <div className="ns-complete"><div className="ns-complete-icon">🎓</div><span className="ns-kicker">LESSON COMPLETE</span><h2>Great work!</h2><div className="ns-score">{score}<small> / {questions.length}</small></div><p>You completed your {grade} Number School lesson.</p><div className="ns-complete-actions"><button className="ns-primary" onClick={()=>void loadQuestions()}>Practice Again</button><button className="ns-secondary" onClick={onClose}>Return to Town</button></div></div> : <>
        <header className="ns-header"><div className="ns-school-mark">🏫</div><div><span className="ns-kicker">{grade} · MATHEMATICS</span><h2 id="number-school-title">Number School</h2></div><div className="ns-counter">{index+1}<small>/{questions.length}</small></div></header>
        <div className="ns-progress"><span style={{width:`${((index+(feedback?1:0))/questions.length)*100}%`}}/></div>
        <div className="ns-question-card"><div className={`ns-difficulty ${question.difficulty??"easy"}`}>{question.difficulty??"practice"}</div><h3>{question.prompt}</h3>
          {isOrdering ? <div className="ns-special"><div className="ns-task-hint">↕️ Arrange the numbers in the correct order. Use ↑ ↓ or drag them.</div><div className="ns-order-list" style={{marginTop:12}}>{order.map((item,i)=><div key={`${item}-${i}`} className="ns-order-item" draggable={!feedback} onDragStart={()=>setDragging(item)} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(dragging&&dragging!==item){const a=order.indexOf(dragging),b=order.indexOf(item);const n=[...order];n.splice(a,1);n.splice(b,0,dragging);setOrder(n)}setDragging(null)}}><GripVertical size={18} color="#8aa0b2"/><span className="ns-order-num">{i+1}</span><span className="ns-order-text">{item}</span><div className="ns-order-controls"><button onClick={()=>moveOrder(i,-1)} disabled={i===0||Boolean(feedback)} aria-label="Move up">↑</button><button onClick={()=>moveOrder(i,1)} disabled={i===order.length-1||Boolean(feedback)} aria-label="Move down">↓</button></div></div>)}</div><button className="ns-special-check" disabled={Boolean(feedback)||order.length<2} onClick={submitOrdering}>Check Order</button></div>
          : question.question_type === "drag_drop" && dragData ? <div className="ns-special"><div className="ns-task-hint">🧩 Drag each item into the matching group. On mobile, tap an item, then tap a group.</div><div className="ns-drag-items">{dragData.items.map(item=><button key={item.id} draggable={!feedback} className={`ns-drag-chip ${touchPick===item.id?"selected":""}`} onDragStart={()=>setDragging(item.id)} onClick={()=>{if(feedback)return;setTouchPick(touchPick===item.id?null:item.id)}}>{item.text}</button>)}</div><div className="ns-drop-groups">{dragData.groups.map(group=><div key={group} className="ns-drop-group" onDragOver={e=>e.preventDefault()} onDrop={()=>{if(dragging)dropToGroup(dragging,group)}} onClick={()=>{if(touchPick)dropToGroup(touchPick,group)}}><h4>{group}</h4>{dragData.items.filter(item=>same(dragMap[item.id]??"",group)).map(item=><span className="ns-drop-chip" key={item.id}>{item.text}</span>)}</div>)}</div><button className="ns-special-check" disabled={Boolean(feedback)||Object.keys(dragMap).length!==dragData.items.length} onClick={submitDragDrop}>Check Matches</button></div>
          : isInput ? <div className="ns-input-row"><input autoFocus value={input} onChange={e=>setInput(e.target.value)} disabled={Boolean(feedback)} placeholder="Type your answer" onKeyDown={e=>{if(e.key==="Enter")submit(input)}}/><button className="ns-primary" disabled={!input.trim()||Boolean(feedback)} onClick={()=>submit(input)}>Check</button></div> : <div className="ns-options">{options.map((option,i)=>{const value=String(option.id??option.text??i);const chosen=selected===value||selected===option.text;return <button key={value} className={chosen?"chosen":""} disabled={Boolean(feedback)} onClick={()=>submit(value)}><b>{String.fromCharCode(65+i)}</b><span>{option.text??option.label??value}</span></button>})}</div>}
        </div>
        {feedback&&<div className={`ns-feedback ${feedback}`}><div className="ns-feedback-title">{feedback==="correct"?<CheckCircle2 size={21}/>:<XCircle size={21}/>}<b>{feedback==="correct"?"Correct!":"Not quite"}</b></div>{feedback==="wrong"&&<p>Correct answer: <strong>{isOrdering?parseOrder(question).join(" → "):question.question_type==="drag_drop"&&dragData?dragData.items.map(i=>`${i.text} → ${i.group}`).join(" · "):question.answer}</strong></p>}{question.explanation&&<small>{question.explanation}</small>}<button className="ns-next" onClick={next}>{index===questions.length-1?"Finish Lesson":"Next Question →"}</button></div>}
        <footer className="ns-footer">✨ Grade-level question bank · {grade}</footer>
      </>}
    </section>
  </div>;
}
