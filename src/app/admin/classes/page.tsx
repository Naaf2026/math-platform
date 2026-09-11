"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Archive, CheckCircle2, Plus, RefreshCw, ShieldCheck, UserPlus, Users, UserRoundCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ClassRow = { id:number; name:string; class_code:string; grade:string|null; learning_level:string|null; description:string; status:string };
type Profile = { id:string; full_name:string|null; display_name:string|null; grade:string|null; learning_level:string|null };
type Member = { student_id:string; status:string; profile?:Profile };
type TeacherAssignment = { teacher_id:string; role:string; status:string; profile?:Profile };

export default function AdminClassesPage(){
 const supabase=createClient();
 const[classes,setClasses]=useState<ClassRow[]>([]),[profiles,setProfiles]=useState<Profile[]>([]),[teachers,setTeachers]=useState<Profile[]>([]);
 const[selectedClassId,setSelectedClassId]=useState<number|null>(null),[members,setMembers]=useState<Member[]>([]),[assignments,setAssignments]=useState<TeacherAssignment[]>([]);
 const[status,setStatus]=useState("Loading class management…"),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const[name,setName]=useState(""),[code,setCode]=useState(""),[grade,setGrade]=useState(""),[level,setLevel]=useState(""),[description,setDescription]=useState("");
 const[studentToAdd,setStudentToAdd]=useState(""),[teacherToAdd,setTeacherToAdd]=useState(""),[teacherRole,setTeacherRole]=useState("teacher");

 const selectedClass=useMemo(()=>classes.find(c=>c.id===selectedClassId)??null,[classes,selectedClassId]);
 const activeStudents=useMemo(()=>profiles.filter(p=>!members.some(m=>m.student_id===p.id)),[profiles,members]);
 const activeTeachers=useMemo(()=>teachers.filter(p=>!assignments.some(a=>a.teacher_id===p.id&&a.status==='active')),[teachers,assignments]);

 async function load(){
  if(!supabase){setStatus("Supabase is not configured yet.");return;}
  setStatus("Loading class management…");setNotice("");
  const{data:{user},error:userError}=await supabase.auth.getUser();
  if(userError){setStatus(`Authentication check failed: ${userError.message}`);return;}
  if(!user){window.location.href="/login";return;}
  const{data:isAdmin,error:roleError}=await supabase.rpc("has_role",{p_role:"admin"});
  if(roleError){setStatus(`Administrator verification failed: ${roleError.message}`);return;}
  if(isAdmin!==true){setStatus("Admin access is required. Your account must have the admin role.");return;}
  const[{data:cs,error:ce},{data:ps,error:pe},{data:rs,error:re}]=await Promise.all([
   supabase.from("classes").select("id,name,class_code,grade,learning_level,description,status").order("created_at",{ascending:false}),
   supabase.from("profiles").select("id,full_name,display_name,grade,learning_level").order("full_name"),
   supabase.from("user_roles").select("user_id").eq("role","teacher")
  ]);
  if(ce){setStatus(ce.message);return;}if(pe){setStatus(pe.message);return;}if(re){setStatus(re.message);return;}
  const teacherIds=(rs??[]).map((r:{user_id:string})=>r.user_id);
  setClasses((cs??[]) as ClassRow[]);setProfiles((ps??[]) as Profile[]);setTeachers(((ps??[]) as Profile[]).filter(p=>teacherIds.includes(p.id)));setStatus("");
  const nextSelected=selectedClassId&&((cs??[]) as ClassRow[]).some(c=>c.id===selectedClassId)?selectedClassId:((cs??[]) as ClassRow[])[0]?.id??null;
  setSelectedClassId(nextSelected);
  if(nextSelected) await loadClassDetails(nextSelected);
  else {setMembers([]);setAssignments([]);}
 }
 useEffect(()=>{void load()},[]);

 async function loadClassDetails(classId:number){
  if(!supabase)return;
  const[{data:ms,error:me},{data:ts,error:te}]=await Promise.all([
   supabase.from("class_members").select("student_id,status").eq("class_id",classId).eq("status","active"),
   supabase.from("class_teachers").select("teacher_id,role,status").eq("class_id",classId).eq("status","active")
  ]);
  if(me){setNotice(me.message);return;}if(te){setNotice(te.message);return;}
  const memberRows=(ms??[]) as Member[];const teacherRows=(ts??[]) as TeacherAssignment[];
  setMembers(memberRows.map(m=>({...m,profile:profiles.find(p=>p.id===m.student_id)})));
  setAssignments(teacherRows.map(t=>({...t,profile:teachers.find(p=>p.id===t.teacher_id)})));
 }
 useEffect(()=>{if(selectedClassId) void loadClassDetails(selectedClassId);},[selectedClassId,profiles,teachers]);

 async function createClass(e:FormEvent){
  e.preventDefault();if(!supabase)return;setBusy(true);setNotice("");
  const{error}=await supabase.rpc("create_learning_class",{p_name:name,p_class_code:code,p_grade:grade||null,p_learning_level:level||null,p_description:description});
  setBusy(false);if(error){setNotice(error.message);return;}
  setName("");setCode("");setGrade("");setLevel("");setDescription("");setNotice("Class created successfully.");await load();
 }

 async function addStudent(){
  if(!supabase||!selectedClassId||!studentToAdd)return;setBusy(true);setNotice("");
  const{error}=await supabase.rpc("add_student_to_class",{p_class_id:selectedClassId,p_student_id:studentToAdd});
  setBusy(false);if(error){setNotice(error.message);return;}setStudentToAdd("");setNotice("Student added to class.");await loadClassDetails(selectedClassId);
 }
 async function removeStudent(studentId:string){
  if(!supabase||!selectedClassId)return;if(!window.confirm("Remove this student from the class?"))return;setBusy(true);setNotice("");
  const{error}=await supabase.rpc("remove_student_from_class",{p_class_id:selectedClassId,p_student_id:studentId});
  setBusy(false);if(error){setNotice(error.message);return;}setNotice("Student removed from class.");await loadClassDetails(selectedClassId);
 }
 async function assignTeacher(){
  if(!supabase||!selectedClassId||!teacherToAdd)return;setBusy(true);setNotice("");
  const{error}=await supabase.rpc("assign_teacher_to_class",{p_class_id:selectedClassId,p_teacher_id:teacherToAdd,p_teacher_role:teacherRole});
  setBusy(false);if(error){setNotice(error.message);return;}setTeacherToAdd("");setNotice("Teacher assigned to class.");await loadClassDetails(selectedClassId);
 }
 async function archiveClass(){
  if(!supabase||!selectedClass)return;if(!window.confirm(`${selectedClass.status==='active'?'Archive':'Reactivate'} ${selectedClass.name}?`))return;setBusy(true);setNotice("");
  const{error}=await supabase.from("classes").update({status:selectedClass.status==='active'?'archived':'active'}).eq("id",selectedClass.id);
  setBusy(false);if(error){setNotice(error.message);return;}setNotice(`Class ${selectedClass.status==='active'?'archived':'reactivated'}.`);await load();
 }

 if(status)return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6"><div className="mx-auto mt-24 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl ring-1 ring-slate-100"><ShieldCheck className="mx-auto text-violet-600" size={48}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Admin Class Management</h1><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500">{status}</p><Link href="/admin" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white"><ArrowLeft size={17}/> Admin dashboard</Link></div></main>;

 return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-24 sm:p-8"><div className="mx-auto max-w-7xl">
  <header className="flex flex-wrap items-center justify-between gap-4"><Link href="/admin" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Admin dashboard</Link><div className="flex gap-2"><Link href="/admin/users" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-slate-200">User Management</Link><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600"><RefreshCw size={16}/> Refresh</button></div></header>
  <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-2xl sm:p-9"><div className="flex flex-wrap items-end justify-between gap-6"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><ShieldCheck size={14}/> Secure administrator view</div><h1 className="mt-4 text-4xl font-black">Class Management 4.1</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">Create classes, assign teachers and manage student rosters through protected Supabase role and class RPCs.</p></div><div className="rounded-2xl bg-white/10 p-4 text-center"><Users className="mx-auto" size={25}/><div className="mt-1 text-2xl font-black">{classes.length}</div><div className="text-xs font-bold text-indigo-100">Classes</div></div></div></section>
  {notice&&<div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4 text-sm font-bold text-violet-800">{notice}</div>}
  <section className="mt-6 grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
   <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7"><div className="flex items-center gap-3"><Plus className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">New class</p><h2 className="text-2xl font-black text-[#071b3a]">Create learning class</h2></div></div><form onSubmit={createClass} className="mt-6 space-y-4"><Field label="Class name"><input value={name} onChange={e=>setName(e.target.value)} required placeholder="e.g. Grade 5 Maths"/></Field><Field label="Class code"><input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} required placeholder="e.g. G5-MATH-01"/></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Grade"><input value={grade} onChange={e=>setGrade(e.target.value)} placeholder="Grade 5"/></Field><Field label="Learning level"><input value={level} onChange={e=>setLevel(e.target.value)} placeholder="Foundation"/></Field></div><Field label="Description"><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="Optional class description"/></Field><button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white disabled:opacity-50"><Plus size={18}/>{busy?" Working…":" Create class"}</button></form></div>
   <div className="space-y-6">
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Class directory</p><h2 className="text-2xl font-black text-[#071b3a]">Select a class</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{classes.filter(c=>c.status==='active').length} active</span></div><div className="mt-5 grid gap-3">{classes.length===0?<div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">No classes created yet.</div>:classes.map(c=><button type="button" key={c.id} onClick={()=>setSelectedClassId(c.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedClassId===c.id?'border-violet-300 bg-violet-50 shadow-sm':'border-slate-100 bg-slate-50 hover:border-violet-100'}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-[#071b3a]">{c.name}</p><p className="mt-1 text-xs font-bold text-slate-500">{c.class_code} · {c.grade||"Grade not set"} · {c.learning_level||"Level not set"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${c.status==='active'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-800'}`}>{c.status}</span></div></button>)}</div></div>
    {selectedClass&&<div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Selected class</p><h2 className="text-2xl font-black text-[#071b3a]">{selectedClass.name}</h2><p className="mt-1 text-sm text-slate-500">{selectedClass.class_code} · {selectedClass.description||"No description"}</p></div><button disabled={busy} onClick={()=>void archiveClass()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"><Archive size={16}/>{selectedClass.status==='active'?'Archive':'Reactivate'}</button></div>
      <div className="mt-7 grid gap-6 xl:grid-cols-2">
       <div className="rounded-2xl bg-slate-50 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Teacher team</p><h3 className="text-lg font-black text-[#071b3a]">{assignments.length} assigned</h3></div><UserRoundCheck className="text-violet-600"/></div><div className="mt-4 space-y-2">{assignments.length===0?<p className="text-sm text-slate-500">No teacher assigned yet.</p>:assignments.map(a=><div key={a.teacher_id} className="flex items-center justify-between rounded-xl bg-white p-3"><div><p className="font-black text-[#071b3a]">{a.profile?.display_name||a.profile?.full_name||"Teacher"}</p><p className="text-xs capitalize text-slate-500">{a.role.replace('_',' ')}</p></div><CheckCircle2 size={18} className="text-emerald-500"/></div>)}</div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><select value={teacherToAdd} onChange={e=>setTeacherToAdd(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><option value="">Select teacher…</option>{activeTeachers.map(t=><option key={t.id} value={t.id}>{t.display_name||t.full_name||"Teacher"}</option>)}</select><select value={teacherRole} onChange={e=>setTeacherRole(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><option value="teacher">Teacher</option><option value="lead_teacher">Lead teacher</option></select><button disabled={busy||!teacherToAdd} onClick={()=>void assignTeacher()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"><UserPlus size={16}/> Assign</button></div></div>
       <div className="rounded-2xl bg-slate-50 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Student roster</p><h3 className="text-lg font-black text-[#071b3a]">{members.length} enrolled</h3></div><Users className="text-violet-600"/></div><div className="mt-4 space-y-2">{members.length===0?<p className="text-sm text-slate-500">No students enrolled yet.</p>:members.map(m=><div key={m.student_id} className="flex items-center justify-between rounded-xl bg-white p-3"><div><p className="font-black text-[#071b3a]">{m.profile?.display_name||m.profile?.full_name||"Student"}</p><p className="text-xs text-slate-500">{m.profile?.grade||"Grade not set"}</p></div><button disabled={busy} onClick={()=>void removeStudent(m.student_id)} className="rounded-lg px-2 py-1 text-xs font-black text-rose-600 hover:bg-rose-50">Remove</button></div>)}</div><div className="mt-4 flex gap-2"><select value={studentToAdd} onChange={e=>setStudentToAdd(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><option value="">Select student…</option>{activeStudents.map(s=><option key={s.id} value={s.id}>{s.display_name||s.full_name||"Student"}{s.grade?` · ${s.grade}`:""}</option>)}</select><button disabled={busy||!studentToAdd} onClick={()=>void addStudent()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"><Plus size={16}/> Add</button></div></div>
      </div>
    </div>}
   </div>
  </section>
  <p className="mt-6 text-center text-xs text-slate-400">{profiles.length} profiles available · {teachers.length} teacher accounts · {classes.filter(c=>c.status==='active').length} active classes</p>
 </div></main>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span><div className="[&_input]:w-full [&_input]:rounded-2xl [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-4 [&_input]:py-3 [&_input]:text-sm [&_input]:font-semibold [&_textarea]:w-full [&_textarea]:rounded-2xl [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:bg-white [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-sm">{children}</div></label>}
