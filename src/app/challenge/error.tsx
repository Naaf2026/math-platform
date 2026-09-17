"use client";

import { useEffect } from "react";

type ChallengeErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ChallengeError({ error, reset }: ChallengeErrorProps) {
  useEffect(() => {
    console.error("Daily Challenge route error:", error);
  }, [error]);

  const message = error?.message || "Unknown runtime error";

  return (
    <main className="grid min-h-screen place-items-center bg-[#e7f5f8] p-6">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-3xl">⚠️</div>
        <h1 className="mt-5 text-2xl font-black text-slate-900">Daily Challenge could not load</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          The page encountered a runtime error. The technical details below will help us identify the exact cause.
        </p>
        <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-left">
          <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Runtime error</div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-red-300">{message}</pre>
          {error?.digest && <div className="mt-3 border-t border-white/10 pt-3 text-[10px] font-mono text-slate-500">Error ID: {error.digest}</div>}
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => reset()} className="rounded-xl bg-cyan-600 px-6 py-3 font-black text-white">
            Reload Challenge
          </button>
          <a href="/dashboard" className="rounded-xl bg-slate-100 px-6 py-3 font-black text-slate-700">
            Back to Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
