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

  return (
    <main className="grid min-h-screen place-items-center bg-[#e7f5f8] p-6">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-3xl">⚠️</div>
        <h1 className="mt-5 text-2xl font-black text-slate-900">Daily Challenge could not load</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          The page encountered a runtime error. Please try again. If it happens again, the error has been logged for diagnosis.
        </p>
        {error?.digest && <p className="mt-3 text-xs font-mono text-slate-400">Error ID: {error.digest}</p>}
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
