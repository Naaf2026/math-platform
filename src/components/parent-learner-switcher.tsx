"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMyLearners, type LearnerAccount } from "@/lib/parent-learners";

const STORAGE_KEY = "fahi-parent-selected-learner";

export default function ParentLearnerSwitcher() {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const [learners, setLearners] = useState<LearnerAccount[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { let active=true; getMyLearners().then(items=>{if(active)setLearners(items)}).catch(()=>{if(active)setLearners([])}).finally(()=>{if(active)setLoading(false)}); return()=>{active=false}; }, []);
  const selectedId = searchParams.get("learner");
  const selected = learners.find(l=>l.learner_id===selectedId) ?? learners[0];
  useEffect(() => {
    if (!learners.length) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const candidate = selectedId || stored;
    const valid = learners.some(l=>l.learner_id===candidate);
    const id = valid ? candidate! : learners[0].learner_id;
    if (window.localStorage.getItem(STORAGE_KEY)!==id) window.localStorage.setItem(STORAGE_KEY,id);
    if (selectedId!==id) { const params=new URLSearchParams(searchParams.toString()); params.set("learner",id); router.replace(`${pathname}?${params.toString()}`); }
  }, [learners, selectedId, pathname, router, searchParams]);
  function selectLearner(id:string){ window.localStorage.setItem(STORAGE_KEY,id); const params=new URLSearchParams(searchParams.toString()); params.set("learner",id); router.push(`${pathname}?${params.toString()}`); }
  if (loading || learners.length===0) return null;
  return <label className="inline-flex items-center gap-2 rounded-2xl border border-violet-100 bg-violet-50/80 px-3 py-2 text-xs font-black text-violet-900 shadow-sm"><span className="hidden sm:inline">Viewing</span><select aria-label="Select learner" value={selected?.learner_id ?? ""} onChange={e=>selectLearner(e.target.value)} className="max-w-40 bg-transparent font-black outline-none">{learners.map(learner=><option key={learner.learner_id} value={learner.learner_id}>{learner.avatar_emoji||"👤"} {learner.display_name} · {learner.grade||"Learner"}</option>)}</select><Check size={14} className="hidden sm:block"/></label>;
}
