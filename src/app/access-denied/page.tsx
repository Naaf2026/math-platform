import Link from "next/link";

export default function AccessDeniedPage() {
  return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto mt-24 max-w-lg rounded-[2rem] bg-white p-10 text-center shadow-xl ring-1 ring-slate-100"><div className="text-5xl">🔒</div><h1 className="mt-5 text-3xl font-black text-[#071b3a]">Access restricted</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your account does not have permission to open this area. Please sign in with the correct account or ask an administrator to assign the required role.</p><Link href="/dashboard" className="mt-7 inline-flex rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Back to dashboard</Link></div></main>;
}
