"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Sparkles, Star, BookOpen, BarChart3, Gamepad2, Target } from "lucide-react";

const activities = [
  {title:"Visual Maths",description:"See maths come to life through illustrated questions.",image:"/homepage-artwork/visual-maths.webp"},
  {title:"Daily Challenge",description:"Build a regular practice habit with fresh challenges.",image:"/homepage-artwork/daily-challenge.webp"},
  {title:"Revision",description:"Revisit topics and practise what you've learned.",image:"/homepage-artwork/revision.webp"},
  {title:"Brain Games",description:"Play, think and solve with engaging maths games.",image:"/homepage-artwork/brain-games.webp"},
  {title:"Buddy Challenge",description:"Make learning social with friendly challenges.",image:"/homepage-artwork/buddy-challenge.webp"},
  {title:"Rewards",description:"Celebrate effort with Mind Sparks and achievements.",image:"/homepage-artwork/rewards.webp"}
];
const faqs = [
  ["Which grades does Fahi Hisaabu cover?","Our learning experience is designed around Maldives primary mathematics for Grades 1–5. Content availability can vary by grade and activity as we expand the question bank."],
  ["Can I see what my child will learn?","Explore the activity previews and try the sample question on this page. Students can practise visual maths, revision and challenges according to available grade content."],
  ["How do I start?","Choose Try Fahi Hisaabu for Free!! to sign in or register. You can review the available trial and subscription options during registration."],
  ["Can my child use a tablet?","Fahi Hisaabu is designed for phones, tablets and computers."] 
];
export default function ParentsPage(){
  const [answer,setAnswer]=useState<number|null>(null);
  const [grade,setGrade]=useState(2);
  const [expanded,setExpanded]=useState<number|null>(null);
  return <main className="min-h-screen bg-[#f2faff] text-[#082b61] student-dashboard-font">
    <header className="sticky top-0 z-50 border-b border-[#d9ecf8] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link href="/" aria-label="Fahi Hisaabu homepage"><img src="/fahi-hisaabu-logo-optimized.webp" alt="Fahi Hisaabu" className="h-14 w-40 object-contain" /></Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-extrabold sm:gap-5">
          <Link href="/" className="hover:text-[#168ff0]">Home</Link>
          <a href="#activities" className="hover:text-[#168ff0]">Activities</a>
          <a href="#curriculum" className="hidden hover:text-[#168ff0] sm:inline">Curriculum</a>
          <Link href="/login" className="rounded-xl bg-[#ff6b22] px-4 py-3 text-white">Try Fahi Hisaabu for Free!!</Link>
        </nav>
      </div>
    </header>
    <section className="relative overflow-hidden bg-[#ddf3ff]">
      <div className="absolute inset-0 bg-[url('/homepage-artwork/hero-illustration.webp')] bg-cover bg-center opacity-45 lg:bg-right" aria-hidden="true"/>
      <div className="absolute inset-0 bg-gradient-to-r from-[#eaf8ff] via-[#eaf8ff]/90 to-[#eaf8ff]/25" aria-hidden="true"/>
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-6 py-14 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#087cba] shadow-sm"><Sparkles size={17}/> Made for young maths learners</span>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">Make Maths Fun.<br/><span className="text-[#168fe1]">Build Confidence.</span></h1>
          <p className="mt-5 max-w-xl text-lg font-semibold leading-relaxed text-[#385e7c]">Help your child learn, practise and play with engaging maths activities inspired by the Maldives primary curriculum.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-[#ff6b22] px-7 py-4 font-black text-white shadow-lg shadow-orange-200">Try Fahi Hisaabu for Free!! <ArrowRight size={19}/></Link><a href="#try-it" className="rounded-2xl border-2 border-[#168fe1] bg-white px-7 py-4 font-black text-[#07528e]">Try a Sample Question</a></div>
          <div className="mt-7 flex flex-wrap gap-4 text-sm font-bold text-[#376484]"><span>✓ Grades 1–5</span><span>✓ Visual learning</span><span>✓ Fun challenges</span></div>
        </div>
        <div className="overflow-hidden rounded-[32px] border-8 border-white bg-white shadow-2xl"><img src="/homepage-artwork/parent-confidence.webp" alt="Parent supporting their child as they learn maths" className="aspect-[4/3] w-full object-cover"/></div>
      </div>
    </section>
    <section id="curriculum" className="mx-auto max-w-7xl px-6 py-16">
      <div className="text-center"><span className="font-black uppercase tracking-widest text-[#168fe1]">Made for the Maldives</span><h2 className="mt-3 text-3xl font-black sm:text-4xl">Maths for Every Primary Grade</h2><p className="mx-auto mt-4 max-w-2xl font-semibold text-[#53738e]">Grade-based practice built around the Maldives primary mathematics curriculum.</p></div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setGrade(n)} aria-pressed={grade===n} className={`rounded-2xl px-7 py-4 font-black shadow-sm transition ${grade===n?"bg-[#168fe1] text-white":"border border-[#d5e9f6] bg-white text-[#125485] hover:bg-[#e8f5ff]"}`}>Grade {n}</button>)}</div>
      <div className="mx-auto mt-7 max-w-3xl rounded-3xl border border-[#d9eaf7] bg-white p-7 shadow-sm"><div className="flex items-center gap-3"><BookOpen className="text-[#168fe1]"/><h3 className="text-xl font-black">Grade {grade} Maths</h3></div><p className="mt-3 font-semibold leading-7 text-[#52728e]">Explore grade-appropriate questions and practice activities. Topics and activity availability depend on the content currently published for this grade.</p><Link href="/login" className="mt-5 inline-flex items-center gap-2 font-black text-[#0a84cb]">Explore Grade {grade} <ArrowRight size={18}/></Link></div>
    </section>
    <section id="activities" className="bg-white py-16"><div className="mx-auto max-w-7xl px-6"><div className="text-center"><span className="font-black uppercase tracking-widest text-[#168fe1]">Learn · Practise · Play</span><h2 className="mt-3 text-3xl font-black sm:text-4xl">Fun Ways to Learn Maths</h2><p className="mt-3 font-semibold text-[#53738e]">Something engaging for every kind of learner.</p></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{activities.map(a=><article key={a.title} className="overflow-hidden rounded-3xl border border-[#dcebf7] bg-[#f8fcff] shadow-sm"><div className="bg-[#eaf6ff]"><img src={a.image} alt={a.title} className="block h-auto w-full" /></div><div className="p-5"><p className="font-semibold leading-6 text-[#54748e]">{a.description}</p></div></article>)}</div></div></section>
    <section id="try-it" className="bg-[#e9f7ff] py-16"><div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2"><div><span className="font-black uppercase tracking-widest text-[#168fe1]">Try it together</span><h2 className="mt-3 text-3xl font-black sm:text-4xl">See How Fun Maths Can Be</h2><p className="mt-4 text-lg font-semibold leading-8 text-[#54748e]">Let your child try a sample question right here. No login needed for this preview.</p><div className="mt-6 flex flex-wrap gap-4 font-black"><span className="rounded-full bg-white px-4 py-2"><Target className="mr-2 inline text-[#168fe1]" size={18}/>Think</span><span className="rounded-full bg-white px-4 py-2"><Star className="mr-2 inline text-[#f5a400]" size={18}/>Learn</span><span className="rounded-full bg-white px-4 py-2"><Gamepad2 className="mr-2 inline text-[#168fe1]" size={18}/>Play</span></div></div><div className="rounded-[32px] border border-[#d6e7f6] bg-white p-6 shadow-xl sm:p-9"><span className="rounded-full bg-[#e9f7ff] px-4 py-2 text-sm font-black text-[#1680c7]">Sample Visual Maths</span><h3 className="mt-6 text-2xl font-black">How many stars can you count?</h3><div className="my-7 grid grid-cols-3 gap-3 rounded-2xl bg-[#fff8df] p-6 text-center text-5xl" aria-label="Six stars">{Array.from({length:6},(_,i)=><span key={i} aria-hidden="true">⭐</span>)}</div><div className="grid grid-cols-3 gap-3">{[5,6,7].map(n=><button key={n} onClick={()=>setAnswer(n)} aria-pressed={answer===n} className={`rounded-2xl border-2 p-4 text-xl font-black transition ${answer===n?(n===6?"border-[#12a57d] bg-[#dff9ee]":"border-[#f2a34a] bg-[#fff0d9]"):"border-[#d6e7f6] hover:border-[#168fe1]"}`}>{n}</button>)}</div>{answer!==null&&<p role="status" className={`mt-5 rounded-xl p-4 font-black ${answer===6?"bg-[#e1f9ec] text-[#087d53]":"bg-[#fff2df] text-[#a65d10]"}`}>{answer===6?"Great job! There are 6 stars!":"Not quite. Count each star and try again!"}</p>}<p className="mt-5 text-center text-sm font-semibold text-[#6b849a]">This is a demonstration question, not a live student assessment.</p></div></div></section>
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2"><div className="overflow-hidden rounded-[32px] bg-[#e7f7ff]"><img src="/homepage-artwork/parent-confidence.webp" alt="Parent and child learning together" className="w-full object-cover"/></div><div><span className="font-black uppercase tracking-widest text-[#168fe1]">For parents</span><h2 className="mt-3 text-3xl font-black sm:text-4xl">Support Your Child's Learning Journey</h2><p className="mt-5 text-lg font-semibold leading-8 text-[#54748e]">Make maths practice a positive part of everyday life. Grade-based questions, revision and rewards give your child different ways to build confidence.</p><div className="mt-6 space-y-4">{["Practise at your child's grade level","Explore illustrated maths questions","Celebrate progress and achievements"].map(t=><p key={t} className="flex items-center gap-3 font-bold"><CheckCircle2 className="shrink-0 text-[#16a77e]"/>{t}</p>)}</div><Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#ff6b22] px-7 py-4 font-black text-white">Try Fahi Hisaabu for Free!! <ArrowRight size={18}/></Link></div></section>
    <section className="bg-white py-16"><div className="mx-auto max-w-3xl px-6"><h2 className="text-center text-3xl font-black">Frequently Asked Questions</h2><div className="mt-8 space-y-3">{faqs.map(([q,a],i)=><div key={q} className="rounded-2xl border border-[#dcebf7] bg-[#f8fcff]"><button onClick={()=>setExpanded(expanded===i?null:i)} aria-expanded={expanded===i} className="flex w-full items-center justify-between gap-4 p-5 text-left font-black">{q}<ChevronDown className={`shrink-0 transition ${expanded===i?"rotate-180":""}`}/></button>{expanded===i&&<p className="px-5 pb-5 font-semibold leading-7 text-[#54748e]">{a}</p>}</div>)}</div></div></section>
    <section className="bg-gradient-to-r from-[#0d77c7] to-[#16a8cd] px-6 py-16 text-center text-white"><h2 className="text-3xl font-black sm:text-4xl">A Little Maths Every Day.<br/>A Brighter Future Ahead.</h2><p className="mx-auto mt-5 max-w-2xl text-lg font-semibold text-white/90">Discover playful practice designed for young maths learners in the Maldives.</p><Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#ff782f] px-9 py-4 font-black text-white shadow-lg">Try Fahi Hisaabu for Free!! <ArrowRight size={20}/></Link></section>
    <footer className="bg-[#082b61] px-6 py-8 text-center text-sm font-semibold text-white">© 2026 Fahi Hisaabu · The Maldives Maths Learning Hub · <Link href="/" className="underline">Home</Link></footer>
  </main>
}