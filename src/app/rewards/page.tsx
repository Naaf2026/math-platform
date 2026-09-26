"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Home,Gamepad2,Trophy,Gift,BarChart3,GraduationCap,LockKeyhole,CheckCircle2,CalendarDays,ArrowRight} from "lucide-react";
import NotificationBell from "@/components/learner-notification-bell";
import {createClient} from "@/lib/supabase/client";

type Achievement={id:string;title:string;description:string;icon:string;sort_order:number};
const days=[5,10,15,20,25,30,50];
const badgeIcons:Record<string,string>={"first-lesson":"🎓","xp-100":"⭐","streak-3":"🔥","topic-complete":"📖","lessons-10":"🏆"};
export default function RewardsPage(){
 const [profile,setProfile]=useState({xp:0,current_streak:0});
 const [sparks,setSparks]=useState(0);
 const [achievements,setAchievements]=useState<Achievement[]>([]);
 const [earned,setEarned]=useState<Set<string>>(new Set());
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{
  const db=createClient();if(!db){setError("Rewards are unavailable right now.");setLoading(false);return;}
  const {data:{user}}=await db.auth.getUser();if(!user){window.location.href="/login";return;}
  // Existing achievement reconciliation; never show badges as earned without stored progress.
  const refreshed=await db.rpc("refresh_learning_achievements");
  const [p,a,e,m]=await Promise.all([
   db.from("profiles").select("xp,current_streak").eq("id",user.id).maybeSingle(),
   db.from("learning_achievements").select("id,title,description,icon,sort_order").order("sort_order"),
   db.from("student_achievements").select("achievement_id").eq("user_id",user.id),
   db.rpc("get_mind_spark_status")
  ]);
  if(!active)return;
  if(p.error||a.error||e.error){setError(p.error?.message||a.error?.message||e.error?.message||"Rewards could not load.");setLoading(false);return;}
  setProfile({xp:p.data?.xp??0,current_streak:p.data?.current_streak??0});
  setAchievements((a.data??[]) as Achievement[]);
  setEarned(new Set((e.data??[]).map((row:{achievement_id:string})=>row.achievement_id)));
  const status=Array.isArray(m.data)?m.data[0]:m.data;
  setSparks(Number(status?.balance??0));
  if(refreshed.error)console.warn("Achievement refresh unavailable",refreshed.error.message);
  setLoading(false);
 })();return()=>{active=false};},[]);
 const cards=achievements.length?achievements:[
  {id:"first-lesson",title:"First Lesson",description:"Complete your first lesson.",icon:"🎓",sort_order:1},
  {id:"xp-100",title:"100 XP",description:"Earn 100 XP from learning activities.",icon:"⭐",sort_order:2},
  {id:"streak-3",title:"3-Day Streak",description:"Learn for three days in a row.",icon:"🔥",sort_order:3},
  {id:"topic-complete",title:"Topic Complete",description:"Complete all practice questions in a topic.",icon:"📖",sort_order:4},
  {id:"lessons-10",title:"10 Lessons",description:"Complete ten lessons.",icon:"🏆",sort_order:5}
 ];
 return <main className="min-h-screen bg-[#eef9ff] text-[#102b51]">
  <header className="hidden lg:block bg-white shadow-sm"><div className="mx-auto flex h-[74px] max-w-[1400px] items-center justify-between gap-5 px-7">
   <Link href="/dashboard"><img src="/fahi-hisaabu-logo-optimized.webp" alt="Fahi Hisaabu" className="h-14 max-w-[180px] object-contain" /></Link>
   <nav className="flex items-center gap-2 text-[15px] font-bold">
    {([{href:"/dashboard",label:"Home",Icon:Home},{href:"/brain-games",label:"Games",Icon:Gamepad2},{href:"/leaderboard",label:"Leaderboard",Icon:Trophy},{href:"/rewards",label:"Rewards",Icon:Gift},{href:"/progress",label:"Progress",Icon:BarChart3},{href:"/profile",label:"Profile",Icon:GraduationCap}]).map(({href,label,Icon})=><Link key={href} href={href} className={`flex items-center gap-2 rounded-xl px-4 py-3 ${href==="/rewards"?"bg-[#e2f3ff] text-[#007be5]":"text-[#425a78] hover:bg-sky-50"}`}><Icon size={19}/>{label}</Link>)}
   </nav><NotificationBell/>
  </div></header>
  <div className="mx-auto max-w-[1400px] pb-12">
   <section aria-label="My Rewards: Solve maths, collect rewards and unlock exciting surprises!" className="relative w-full overflow-hidden bg-[#55c4f6]">
    <img src="/rewards-assets/rewards-hero.webp" alt="My Rewards. Solve maths, collect rewards and unlock exciting surprises. A happy child beside a treasure chest on a Maldivian beach." className="block w-full" />
   </section>
   <div className="space-y-5 px-4 pt-4 sm:px-7">
    {error&&<div role="alert" className="rounded-xl bg-red-50 p-4 font-semibold text-red-700">{error}</div>}
    <section className="grid gap-4 sm:grid-cols-3" aria-label="Reward balances">
     <div className="flex min-h-[120px] items-center gap-5 rounded-[22px] bg-[#fff8e9] p-6"><span className="text-5xl">⭐</span><div><p className="text-4xl font-black">{loading?"—":profile.xp}</p><p className="font-extrabold">Total XP</p><p className="mt-1 text-sm">Keep solving to reach the next level!</p></div></div>
     <div className="flex min-h-[120px] items-center gap-5 rounded-[22px] bg-[#f7edff] p-6"><span className="text-5xl">✨</span><div><p className="text-4xl font-black">{loading?"—":sparks}</p><p className="font-extrabold">Mind Sparks</p><p className="mt-1 text-sm">Earn more to unlock rewards in the shop!</p></div></div>
     <div className="flex min-h-[120px] items-center gap-5 rounded-[22px] bg-[#e8f6ff] p-6"><span className="text-5xl">🔥</span><div><p className="text-4xl font-black">{loading?"—":profile.current_streak}</p><p className="font-extrabold">Day streak</p><p className="mt-1 text-sm">Great job! Keep your streak going!</p></div></div>
    </section>
    <section className="rounded-[24px] border border-[#d3eaff] bg-[#f6fbff] p-4 sm:p-6">
     <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-2xl font-black sm:text-[28px]">Daily Login Rewards</h2><p className="mt-1 text-[#4b6380]">Log in each day to earn Mind Sparks. Keep your streak going for bigger rewards!</p></div><span className="inline-flex items-center gap-2 rounded-full border border-[#9fd1ff] bg-[#e8f5ff] px-3 py-2 text-sm font-bold text-[#1677d6]"><CalendarDays size={16}/>7-day cycle</span></div>
     <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 sm:gap-3">
      {days.map((reward,i)=><div key={i} className="flex min-h-[166px] flex-col items-center justify-between rounded-2xl border border-[#d4e2f1] bg-white p-3 text-center"><p className="font-bold">Day {i+1}</p><span className="text-4xl">{i===2?"🎁":i===6?"🏆":"✨"}</span><p className="font-black">+{reward}<span className="block text-sm font-normal">Sparks</span></p><span className="flex w-full items-center justify-center gap-1 rounded-full bg-[#edf2f8] px-2 py-1.5 text-xs font-bold text-[#647791]"><LockKeyhole size={12}/>Coming soon</span></div>)}
     </div>
     <p className="mt-3 text-xs font-semibold text-[#6583a0]">Daily reward claiming will be enabled when its tracking system is ready.</p>
    </section>
    <section className="rounded-[24px] border border-[#d9eafa] bg-white p-4 sm:p-6">
     <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-black sm:text-[28px]">My Badge Collection</h2><p className="mt-1 text-[#4b6380]">Complete challenges to unlock badges and show your achievements!</p></div><Link href="/progress/achievements" className="inline-flex items-center gap-2 rounded-full border border-[#b7dcff] px-4 py-2 text-sm font-bold text-[#1272d1]">View all badges <ArrowRight size={16}/></Link></div>
     <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(a=>{const unlocked=earned.has(a.id);return <div key={a.id} className={`flex min-h-[190px] flex-col items-center rounded-2xl border p-4 text-center ${unlocked?"border-[#c9e9d8] bg-[#f6fff9]":"border-[#d9e5f3] bg-[#f8fbff]"}`}><span className={`text-5xl ${unlocked?"":"grayscale opacity-60"}`}>{badgeIcons[a.id]||a.icon||"🏅"}</span><h3 className="mt-3 font-extrabold">{a.title}</h3><p className="mt-1 flex-1 text-xs leading-5 text-[#536a85]">{a.description}</p><span className={`mt-3 inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold ${unlocked?"bg-[#1d9e4b] text-white":"bg-[#eaf0f6] text-[#60758d]"}`}>{unlocked?<CheckCircle2 size={14}/>:<LockKeyhole size={13}/>} {unlocked?"Unlocked":"Locked"}</span></div>})}
     </div>
    </section>
    <section className="relative overflow-hidden rounded-[24px] bg-[#60d5ef]">
     <img src="/rewards-assets/rewards-revision-chest.webp" alt="Revision Treasure Chest: Complete your Revision Paper to earn a surprise gift of 5–20 Mind Sparks. A glowing chest and a sea turtle." className="block w-full" />
     <Link href="/revision" aria-label="Start Revision" className="absolute bottom-[12%] left-[5%] h-[21%] w-[19%] rounded-xl focus-visible:outline-4 focus-visible:outline-white"><span className="sr-only">Start Revision</span></Link>
    </section>
    <section className="rounded-[24px] border border-[#d9eafa] bg-white p-4 sm:p-6">
     <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-2xl font-black sm:text-[28px]">Rewards Shop</h2><p className="mt-1 text-[#4b6380]">Spend your Mind Sparks on special rewards!</p></div><span className="rounded-2xl bg-[#f9e8ff] px-4 py-2 font-extrabold text-[#a127b5]">✨ {loading?"—":sparks} Mind Sparks</span></div>
     <div className="mt-5 grid gap-3 md:grid-cols-3">
      {([{icon:"🪸",name:"Ocean Avatar Frame",description:"Decorate your profile with a beautiful ocean frame.",price:50},{icon:"👑",name:"Maths Champion Title",description:"Show off your Maths Champion title on your profile.",price:150},{icon:"🛡️",name:"Streak Shield",description:"Protect your streak if you miss a day.",price:200}]).map(item=><div key={item.name} className="flex min-h-[156px] items-center gap-4 rounded-2xl border border-[#d7e6f7] p-4"><span className="text-6xl">{item.icon}</span><div className="flex flex-1 flex-col gap-2"><h3 className="font-extrabold">{item.name}</h3><p className="text-xs leading-5 text-[#536a85]">{item.description}</p><span className="rounded-xl bg-[#f7e5ff] px-3 py-2 text-center text-sm font-extrabold text-[#a127b5]">✨ {item.price} Sparks</span><span className="text-center text-xs text-[#7c8da3]">Coming soon</span></div></div>)}
     </div>
    </section>
   </div>
  </div>
 </main>;
}
