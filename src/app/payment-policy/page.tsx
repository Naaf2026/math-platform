import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";

const sections = [
  ["Delivery and Access Policy", "FAHI VISSNUN provides digital subscription access. No physical products are delivered. Bank transfer payments are activated after the payment receipt has been received and manually verified. Users should ensure that the payment information and receipt provided are accurate and clearly identifiable."],
  ["Refund, Exchange and Cancellation Policy", "If an online payment fails or is cancelled before successful completion, no subscription access will be granted and no payment will be considered completed. Once a subscription has been successfully activated and access to the digital learning service has been provided, payments are generally non-refundable, except where required by applicable law or where a payment has been charged incorrectly. Subscriptions may be cancelled to prevent future renewal where recurring payments are offered. Cancellation does not normally provide a refund for an already activated subscription period. As FAHI VISSNUN provides a digital service, product exchanges do not apply."],
  ["Keep Your Records", "Please keep a copy of your payment receipt, subscription confirmation, and these policies for your records."],
  ["Support", "For questions regarding payments, subscription activation, cancellations, refunds, or account access, please contact FAHI VISSNUN Support. Official support contact details will be published here before public launch."]
];

export default function PaymentPolicyPage(){
 return <main className="min-h-screen bg-[#eef9ff] text-[#12204a]">
  <header className="bg-[#073b73] text-white shadow-sm"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6"><Link href="/profile" className="flex items-center gap-2 font-black"><ArrowLeft size={20}/>Profile</Link><img src="/dashboard-assets/dashboard-logo.svg" alt="FAHI VISSNUN" className="h-9 w-auto"/></div></header>
  <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
   <section className="rounded-[2rem] bg-[#073b73] p-7 text-white shadow-xl sm:p-10">
    <div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-emerald-200"><CreditCard size={30}/></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">FAHI VISSNUN</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">Payment Policy</h1></div></div>
    <div className="mt-6 grid gap-3 text-sm font-bold sm:grid-cols-2"><p><span className="text-blue-200">Merchant:</span> FAHI VISSNUN</p><p><span className="text-blue-200">Outlet Country:</span> Maldives</p><p><span className="text-blue-200">Transaction Currency:</span> MVR</p><p><span className="text-blue-200">Service:</span> Online mathematics learning platform and digital subscription services.</p></div>
   </section>
   <div className="mt-6 space-y-4">{sections.map(([title,text])=><section key={title} className="rounded-[1.6rem] bg-white p-6 shadow-sm ring-1 ring-slate-100"><h2 className="text-xl font-black text-[#083d78]">{title}</h2><p className="mt-3 font-medium leading-7 text-[#6685a4]">{text}</p></section>)}</div>
   <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-900">Before public launch, add the official merchant/legal name and FAHI VISSNUN support email or phone number.</div>
   <Link href="/profile" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#073b73] px-5 py-3 font-black text-white"><ArrowLeft size={18}/>Back to Profile</Link>
  </div>
 </main>;
}
