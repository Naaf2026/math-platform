import Link from "next/link";
import { Award, BookOpen, Check, ChevronDown, Star } from "lucide-react";

const features = [
  "10,000+ maths questions, quizzes and educational games",
  "Comprehensive question bank with varying difficulty levels",
  "Clear, step-by-step worked solutions",
  "Auto-marked questions with instant feedback",
  "Rewards, games and exciting challenges",
  "Progress tracking reports",
  "Mobile-friendly practice on the go",
  "Certificates and medals for achieving milestones",
];

const faqs = [
  { question: "Can I try all the subjects during the trial?", answer: "Fahi Hisaabu currently offers Maths. Your 3-day trial gives your learner access to the available Maths trial activities." },
  { question: "How much does Fahi Hisaabu cost?", answer: "After the 3-day free trial, the subscription costs MVR 150 per month for each learner." },
  { question: "I have more than one child – what should I do?", answer: "You can create as many learner accounts as you need through your parent account. Each learner gets their own username and password. A separate MVR 150 monthly subscription is required for each learner." },
  { question: "Can my child learn on a mobile phone?", answer: "Yes. Fahi Hisaabu is designed for phones, tablets and computers." },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-[#16345b]">
      <div className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:pt-16">
        <div className="text-center">
          <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.2em] text-[#ed9a13]">Fahi Hisaabu Pricing</p>
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">Try FREE for 3 days.</h1>
          <p className="mt-3 text-2xl font-extrabold sm:text-3xl">Then MVR 150/month.</p>
          <p className="mt-3 text-sm font-medium text-slate-500">Monthly subscription per learner.</p>
        </div>

        <section className="mx-auto mt-12 max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_8px_35px_rgba(25,65,105,0.07)] sm:px-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#fff3d9]">
            <BookOpen className="h-11 w-11 text-[#ee9a16]" strokeWidth={2.2} aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-3xl font-black">Maths</h2>
          <p className="mx-auto mt-3 max-w-sm text-base italic leading-relaxed text-slate-600">Based on the Maldives Ministry of Education’s Mathematics Syllabus</p>
          <Link href="/parents#try-it" className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#f49c20] px-8 py-4 text-lg font-extrabold text-white transition hover:bg-[#db8410] sm:w-auto sm:min-w-56">Try Now</Link>
        </section>

        <section className="mx-auto mt-16 max-w-2xl">
          <h2 className="mb-7 text-center text-2xl font-black sm:text-3xl">Your Maths subscription includes:</h2>
          <div className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400"><Star className="h-7 w-7 fill-white text-white" aria-hidden="true" /></span>
            <div><p className="text-xs font-black uppercase tracking-wider text-amber-700">Curriculum aligned</p><p className="mt-1 text-lg font-extrabold leading-snug">Aligned with the Maldives Grade 1–5 Mathematics curriculum</p></div>
          </div>
          <ul className="space-y-5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-base font-medium leading-relaxed text-slate-700">
                <Check className="mt-0.5 h-6 w-6 shrink-0 text-[#19a56c]" strokeWidth={3} aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-center"><Link href="/subscription" className="font-extrabold italic text-[#1675d1] underline decoration-2 underline-offset-4 hover:text-[#0d5298]">Ready to subscribe without a trial? Click here.</Link></p>
        </section>

        <section className="mx-auto mt-16 max-w-2xl border-t border-slate-200 pt-12">
          <h2 className="mb-7 text-center text-3xl font-black">FAQs</h2>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-extrabold marker:hidden [&::-webkit-details-marker]:hidden">
                  {faq.question}<ChevronDown className="h-5 w-5 shrink-0 transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 pr-8 leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
        <div className="mt-12 text-center"><Link href="/parents#try-it" className="inline-flex items-center justify-center rounded-full bg-[#f49c20] px-9 py-4 font-extrabold text-white hover:bg-[#db8410]">Start Your Free 3-Day Trial</Link></div>
      </div>
    </main>
  );
}
