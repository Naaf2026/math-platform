import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const sections = [
  ["1. Information We Collect", "FAHI VISSNUN may collect account and profile information needed to provide the learning service, such as a learner name, grade, account identifier and optional profile image. The platform also records learning activity such as questions attempted, answers, progress, XP, streaks, achievements, rewards and game activity."],
  ["2. How We Use Information", "Learner information is used to provide and improve the learning experience, authenticate accounts, show appropriate learning activities, record progress, calculate rewards and streaks, maintain platform security, troubleshoot problems and support users."],
  ["3. Student and Child Privacy", "FAHI VISSNUN is designed for learners, including school-age children. We aim to collect only information reasonably needed to operate the learning experience. Children should use the service with the involvement of a parent, guardian or school where required by applicable rules."],
  ["4. Learning and Progress Data", "The platform may store question attempts, answers, scores, activity history, challenge completion, revision progress, game activity, XP, streaks and achievements so learners can continue their learning journey and view progress over time."],
  ["5. Profile Images", "Where profile photo upload is available, an uploaded image is used to personalize the learner profile. Learners should not upload images they do not have permission to use."],
  ["6. Service Providers", "FAHI VISSNUN uses technology service providers to operate the platform, including services for authentication, databases, storage and hosting. Information may be processed by those providers as necessary to deliver the service."],
  ["7. Security", "We use reasonable technical and organizational measures intended to protect learner information. No online service or storage system can guarantee absolute security."],
  ["8. Data Retention and Deletion", "Information may be retained while an account is active and as reasonably necessary to operate the service, maintain security, resolve issues or meet applicable obligations. A learner, parent or guardian may contact the platform operator to ask about access, correction or deletion options."],
  ["9. Changes to This Policy", "This Privacy Policy may be updated as FAHI VISSNUN develops. When material changes are made, the updated policy and effective date should be published on this page."],
  ["10. Contact", "Questions about privacy, learner information, access, correction or deletion should be directed to the FAHI VISSNUN platform operator. Official privacy contact details will be published here before public launch."]
];

export default function PrivacyPage(){
 return <main className="min-h-screen bg-[#eef9ff] text-[#12204a]">
  <header className="bg-[#073b73] text-white shadow-sm"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6"><Link href="/profile" className="flex items-center gap-2 font-black"><ArrowLeft size={20}/>Profile</Link><img src="/dashboard-assets/dashboard-logo.svg" alt="FAHI VISSNUN" className="h-9 w-auto"/></div></header>
  <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
   <section className="rounded-[2rem] bg-[#073b73] p-7 text-white shadow-xl sm:p-10"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-cyan-200"><ShieldCheck size={30}/></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">FAHI VISSNUN</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">Privacy Policy</h1></div></div><p className="mt-5 max-w-2xl font-semibold leading-7 text-blue-100">This page explains how information is handled when learners use the FAHI VISSNUN maths learning platform.</p><p className="mt-3 text-sm font-bold text-blue-200">Draft for pre-launch review • Updated September 2026</p></section>
   <div className="mt-6 space-y-4">{sections.map(([title,text])=><section key={title} className="rounded-[1.6rem] bg-white p-6 shadow-sm ring-1 ring-slate-100"><h2 className="text-xl font-black text-[#083d78]">{title}</h2><p className="mt-3 font-medium leading-7 text-[#6685a4]">{text}</p></section>)}</div>
   <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-900">Before public launch, the platform operator's legal name, privacy contact details, applicable data-retention periods and any required parent/guardian consent process should be confirmed and added to this policy.</div>
   <Link href="/profile" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#073b73] px-5 py-3 font-black text-white"><ArrowLeft size={18}/>Back to Profile</Link>
  </div>
 </main>;
}
