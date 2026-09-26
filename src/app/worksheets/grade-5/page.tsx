"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/client";
type Item={q:string;a:string;hint:string;visual?:string};
const topics=[
["6-digit numbers","5A · Number Concept"],["Place value","5A · Number Concept"],["Comparing large numbers","5A · Number Concept"],["Rounding and estimation","5A · Number Concept"],["Counting in thousands","5A · Number Concept"],["Number words","5A · Number Concept"],
["Addition and subtraction","5A · Addition and Subtraction"],["Multiplication","5A · Multiplication and Division"],["Division","5A · Multiplication and Division"],["Money (MVR)","5A · Money"],["Rufiyaa and laari","5A · Money"],["Negative numbers","5A · Negative Numbers"],
["Fractions","5A · Fractions, Decimals and Percentages"],["Ordering fractions","5A · Fractions, Decimals and Percentages"],["Equivalent fractions","5A · Fractions, Decimals and Percentages"],["Adding fractions","5A · Fractions, Decimals and Percentages"],["Decimals","5A · Fractions, Decimals and Percentages"],["Percentages","5A · Fractions, Decimals and Percentages"],["Ratio","5A · Ratio and Proportion"],
["Length","5B · Measurement"],["Mass","5B · Measurement"],["Capacity","5B · Measurement"],["Perimeter","5B · Perimeter, Area and Volume"],["Area","5B · Perimeter, Area and Volume"],["Volume","5B · Perimeter, Area and Volume"],["Time","5B · Time"],
["3-D shapes","5B · Shape and Space"],["Symmetry","5B · Shape and Space"],["2-D shapes","5B · Shape and Space"],["Positions and directions","5B · Shape and Space"],["Angles","5B · Shape and Space"],
["Handling data","5B · Handling Data"],["Mode and range","5B · Handling Data"],["Probability","5B · Handling Data"],["Number patterns","5B · Patterning and Algebra"],["Prime numbers","5B · Patterning and Algebra"],["Lowest common multiple","5B · Patterning and Algebra"],["Simple algebra","5B · Patterning and Algebra"]
] as const;
function make(topic:string,i:number,seed:number,challenge=1):Item{
 const n=i+seed*43+1,a=100000+(n*7919)%850000,b=10000+(n*3791)%85000,x=3+n%16,y=2+(n*7)%11,z=1+n%8;
 switch(topic){
 case "6-digit numbers":return challenge===1?{q:`Write the number immediately before ${a.toLocaleString("en-US")}.`,a:String(a-1),hint:"Subtract one."}:challenge===2?{q:`Write the number immediately after ${a.toLocaleString("en-US")}.`,a:String(a+1),hint:"Add one."}:{q:`What is ${a.toLocaleString("en-US")} plus 1,000?`,a:String(a+1000),hint:"Increase the thousands place."};
 case "Comparing large numbers":return{q:`Write >, < or = : ${a.toLocaleString("en-US")} ___ ${(a+(n%3-1)*1000).toLocaleString("en-US")}.`,a:n%3===0?">":n%3===1?"=":"<",hint:"Compare from the hundred-thousands place."};
 case "Counting in thousands":return{q:`Count on by ${[100,1000,10000][n%3]}: ${a.toLocaleString("en-US")}, ___ .`,a:String(a+[100,1000,10000][n%3]),hint:"Add the given interval."};
 case "Number words":{const thousands=100+n%900;const v=thousands*1000;const words=(num:number)=>{const ones=["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"],tens=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];return [num>=100?ones[Math.floor(num/100)]+" hundred":"",num%100<20?ones[num%100]:[tens[Math.floor(num%100/10)],ones[num%10]].filter(Boolean).join(" ")].filter(Boolean).join(" ")};return{q:`Write ${v.toLocaleString("en-US")} in words.`,a:`${words(thousands)} thousand`,hint:"Read the thousands group, then add thousand."}}
 case "Place value":{const place=[1,10,100,1000,10000,100000][n%6];return{q:`What is the value of digit ${Math.floor(a/place)%10} in ${a.toLocaleString("en-US")}?`,a:String(Math.floor(a/place)%10*place),hint:"Find the digit's place value."}}
 case "Rounding and estimation":{const u=[10,100,1000,10000][n%4];return{q:`Round ${a.toLocaleString("en-US")} to the nearest ${u.toLocaleString("en-US")}.`,a:String(Math.round(a/u)*u),hint:"Look at the next digit to decide whether to round up."}}
 case "Factors and multiples":return{q:`What is the smallest multiple of ${x} greater than ${x*y}?`,a:String(x*(y+1)),hint:"Add the number to its previous multiple."};
 case "Prime and composite numbers":{const v=[11,12,13,15,17,19,21,23,25,29][n%10];return{q:`Is ${v} prime or composite?`,a:[11,13,17,19,23,29].includes(v)?"prime":"composite",hint:"A prime number has exactly two positive factors."}}
 case "Addition and subtraction":return n%2?{q:`${a.toLocaleString("en-US")} + ${b.toLocaleString("en-US")} = ?`,a:String(a+b),hint:"Align place values."}:{q:`${a.toLocaleString("en-US")} − ${b.toLocaleString("en-US")} = ?`,a:String(a-b),hint:"Use column subtraction."};
 case "Multiplication":{const left=challenge===1?x*3:challenge===2?x*12:x*123;const right=challenge===1?y:challenge===2?y+9:y+19;return{q:`${left} × ${right} = ?`,a:String(left*right),hint:"Use partial products or long multiplication."}}
 case "Division":{const divisor=challenge===1?x:challenge===2?x+10:x+20;const quotient=challenge===1?y*z:challenge===2?y*z*3:y*z*11;return{q:`${divisor*quotient} ÷ ${divisor} = ?`,a:String(quotient),hint:"Divide or use inverse multiplication."}}
 case "Order of operations":return{q:`${x} + ${y} × ${z} = ?`,a:String(x+y*z),hint:"Multiply before adding."};
 case "Ordering fractions":{const d=5+n%8,p=1+n%3,q=p+1;return{q:`Which is larger: ${p}/${d} or ${q}/${d}?`,a:`${q}/${d}`,hint:"With equal denominators, compare numerators."}}
 case "Fractions":{const numerator=1+n%7,denominator=numerator+1+(Math.floor(n/7)%4),whole=denominator*(3+Math.floor(n/11)%20);return{q:`What is ${numerator}/${denominator} of ${whole}?`,a:String(numerator*whole/denominator),hint:"Divide by the denominator, then multiply by the numerator."}}
 case "Equivalent fractions":return{q:`Complete: ${z}/${z+2} = ___/${(z+2)*y}.`,a:String(z*y),hint:"Multiply numerator and denominator by the same number."};
 case "Adding fractions":{const den=5+n%7,p=1+n%2,q=1+(n%3);return{q:`Calculate ${p}/${den} + ${q}/${den}. Give your answer as a fraction.`,a:`${p+q}/${den}`,hint:"For like denominators, add the numerators."}}
 case "Decimals":{const v=(x*10+y)/10;return{q:`${v.toFixed(1)} + ${(z/10).toFixed(1)} = ?`,a:(v+z/10).toFixed(1),hint:"Line up the decimal points."}}
 case "Percentages":return{q:`What is ${[10,20,25,50][n%4]}% of ${[10,20,25,50][n%4]===25?x*4*10:x*100}?`,a:String([10,20,25,50][n%4]*([10,20,25,50][n%4]===25?x*4*10:x*100)/100),hint:"Percent means per hundred."};
 case "Ratio":return{q:`Red to blue counters are in the ratio ${x}:${y}. If there are ${x*z} red counters, how many blue counters are there?`,a:String(y*z),hint:"Find the multiplier, then multiply the other part."};
 case "Rufiyaa and laari":{const v=x*100+y*5;return{q:`Convert ${v} laari to rufiyaa (write a number with two decimal places).`,a:(v/100).toFixed(2),hint:"100 laari = MVR 1."}}
 case "Money (MVR)":{const price=x*25,payment=price+(n%5+1)*10;return{q:`A bag costs MVR ${price}. You pay MVR ${payment}. What is your change in rufiyaa?`,a:String(payment-price),hint:"Subtract the cost from the amount paid."}}
 case "Negative numbers":return{q:`Calculate ${-x} + ${y+15}.`,a:String(-x+y+15),hint:"Move right for a positive number."};
 case "Length":return{q:`Convert ${x} m ${y*10} cm to centimetres.`,a:String(x*100+y*10),hint:"1 m = 100 cm."};
 case "Mass":return{q:`Convert ${x} kg ${y*100} g to grams.`,a:String(x*1000+y*100),hint:"1 kg = 1,000 g."};
 case "Capacity":return{q:`Convert ${x} L ${y*100} mL to millilitres.`,a:String(x*1000+y*100),hint:"1 L = 1,000 mL."};
 case "Perimeter":return{q:`A rectangle is ${x+8} cm long and ${y+3} cm wide. Find its perimeter in cm.`,a:String(2*(x+y+11)),hint:"Perimeter = 2 × (length + width)."};
 case "Area":return{q:`Find the area of a rectangle measuring ${x+4} cm by ${y+3} cm (cm²).`,a:String((x+4)*(y+3)),hint:"Area = length × width."};
 case "Volume":return{q:`Find the volume of a cuboid ${x} cm × ${y} cm × ${z} cm (cm³).`,a:String(x*y*z),hint:"Multiply length × width × height."};
 case "Time":{const duration=15+(n%8)*15,startHour=8+Math.floor(n/8)%7,startMinute=(Math.floor(n/56)%4)*15;const total=startHour*60+startMinute+duration;return{q:`A lesson starts at ${String(startHour).padStart(2,"0")}:${String(startMinute).padStart(2,"0")} and lasts ${duration} minutes. What time does it end? (HH:MM)`,a:`${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`,hint:"Add the minutes to the starting time."}}
 case "Angles":{const v=[45,90,115,180,70,135][n%6];return{q:`Classify a ${v}° angle: acute, right, obtuse or straight.`,a:v===90?"right":v===180?"straight":v<90?"acute":"obtuse",hint:"Acute < 90°, right = 90°, obtuse between 90° and 180°."}}
 case "2-D shapes":{const v=[3,4,5,6,8][n%5];return{q:`How many sides does a ${["triangle","quadrilateral","pentagon","hexagon","octagon"][n%5]} have?`,a:String(v),hint:"Count the straight edges."}}
 case "Symmetry":{const shapes=["square","rectangle","equilateral triangle","regular pentagon","regular hexagon","isosceles triangle","regular octagon"];const k=n%shapes.length;return{q:`How many lines of symmetry does a ${shapes[k]} have?`,a:String([4,2,3,5,6,1,8][k]),hint:"Count the reflection lines."}}
 case "3-D shapes":{const k=n%4;const names=["cube","triangular prism","square-based pyramid","rectangular prism"],faces=[6,5,5,6],edges=[12,9,8,12],vertices=[8,6,5,8];const mode=Math.floor(n/4)%3;return{q:`How many ${["faces","edges","vertices"][mode]} does a ${names[k]} have?`,a:String([faces,edges,vertices][mode][k]),hint:"Count the requested features of the solid."}}
 case "Positions and directions":{const dirs=["north","east","south","west"],start=n%4,steps=1+Math.floor(n/4)%3,clockwise=Math.floor(n/12)%2===0;return{q:`You are facing ${dirs[start]}. Turn ${steps*90}° ${clockwise?"clockwise":"anticlockwise"}. Which direction are you now facing?`,a:dirs[(start+(clockwise?steps:4-steps))%4],hint:"A quarter turn changes direction by 90°."}}
 case "Mode and range":{const v=[x,y,x,z,x+2];return{q:`Find the range of the data: ${v.join(", ")}.`,a:String(Math.max(...v)-Math.min(...v)),hint:"Range = highest value − lowest value."}}
 case "Probability":{const red=2+n%4,blue=red+2;return{q:`A bag has ${red} red and ${blue} blue counters. What is the probability of picking a red counter? Answer as a fraction.`,a:`${red}/${red+blue}`,hint:"Favourable outcomes / total outcomes."}}
 case "Handling data":return{q:`A class recorded ${x} apples, ${y} bananas and ${z} oranges. How many pieces of fruit in total?`,a:String(x+y+z),hint:"Add all three categories.",visual:`Apples: ${"■".repeat(x)}\nBananas: ${"■".repeat(y)}\nOranges: ${"■".repeat(z)}`};
 case "Simple algebra":return{q:`Solve for n: n + ${x} = ${x+y}.`,a:String(y),hint:"Subtract the known number from both sides."};
 case "Prime numbers":{const v=2+(n*17)%48;const prime=Array.from({length:Math.max(0,v-2)},(_,k)=>k+2).every(d=>v%d!==0);return{q:`Is ${v} prime or composite?`,a:prime?"prime":"composite",hint:"Prime numbers have exactly two positive factors."}}
 case "Lowest common multiple":{const u=2+n%7,v=2+(n*3)%6;let k=Math.max(u,v);while(k%u!==0||k%v!==0)k++;return{q:`Find the lowest common multiple (LCM) of ${u} and ${v}.`,a:String(k),hint:"Find the smallest positive number divisible by both."}}
 default:return{q:`Find the next term: ${x}, ${x+y}, ${x+2*y}, ___`,a:String(x+3*y),hint:`Add ${y} each time.`};
 }
}
export default function Grade5Worksheets({embedded=false}:{embedded?:boolean}){
const [challenge,setChallenge]=useState(1),[learnerName,setLearnerName]=useState(""),[printMode,setPrintMode]=useState<"blank"|"completed"|"answer"|null>(null);
const [topic,setTopic]=useState<string>(topics[0][0]),[count,setCount]=useState(10),[seed,setSeed]=useState(0),[answers,setAnswers]=useState<Record<number,string>>({}),[checked,setChecked]=useState(false);
const questions=useMemo(()=>Array.from({length:count},(_,i)=>make(topic,i+((challenge-1)*count),seed,challenge)),[topic,count,seed,challenge]);
useEffect(()=>{let active=true;const client=createClient();void client?.auth.getUser().then(async ({data:auth})=>{if(!auth.user)return;const {data}=await client.from("profiles").select("full_name").eq("id",auth.user.id).maybeSingle();if(active)setLearnerName(data?.full_name||"")});return()=>{active=false}},[]);
useEffect(()=>{const finish=()=>setPrintMode(null);window.addEventListener("afterprint",finish);return()=>window.removeEventListener("afterprint",finish)},[]);
const print=(mode:"blank"|"completed"|"answer")=>{if(mode==="answer"&&!worksheetCompleted)return;setPrintMode(mode);setTimeout(()=>window.print(),150)};
const reset=()=>{setAnswers({});setChecked(false);setPrintMode(null)};
const worksheetCompleted=checked&&questions.length>0&&questions.every((_,i)=>(answers[i]??"").trim().length>0);
const normalise=(value:string)=>value.trim().toLowerCase().replace(/,/g,"").replace(/\s+/g," ");
const score=questions.filter((p,i)=>normalise(answers[i]??"")===normalise(p.a)).length;
return <main className={embedded?"bg-[#f8f5e9] text-[#17234b] print:bg-white":"min-h-screen bg-[#f8f5e9] text-[#17234b] print:bg-white"}>
 <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 print:max-w-none print:p-0">
 {!embedded&&<div className="mb-5 flex gap-5 print:hidden"><Link href="/dashboard" className="font-bold text-[#073b73]">← Home</Link><Link href="/worksheets" className="font-bold text-[#073b73]">All worksheets</Link></div>}
 <header className="mb-5 print:hidden"><h1 className="text-3xl font-black">Grade 5 Worksheets</h1><p className="text-sm font-medium">Original practice questions aligned to Exploring Mathematics 5A and 5B.</p></header>
 <section className="rounded-[1.5rem] bg-white p-4 shadow-sm sm:p-5 print:hidden">
  <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
   <label className="block min-w-0"><span className="mb-2 block text-sm font-black">Topic</span><select className="w-full rounded-xl border-2 border-violet-100 bg-white px-3 py-3 font-bold focus:border-violet-500" value={topic} onChange={e=>{setTopic(e.target.value);reset()}}>{Array.from(new Set(topics.map(t=>t[1]))).map(group=><optgroup label={group} key={group}>{topics.filter(t=>t[1]===group).map(t=><option key={t[0]} value={t[0]}>{t[0]}</option>)}</optgroup>)}</select></label>
   <label className="block min-w-0"><span className="mb-2 block text-sm font-black">Challenge</span><select className="w-full rounded-xl border-2 border-violet-100 bg-white px-3 py-3 font-bold focus:border-violet-500" value={challenge} onChange={e=>{setChallenge(Number(e.target.value));reset()}}>{[1,2,3].map(n=><option key={n} value={n}>Challenge {n}</option>)}</select></label>
   <label className="block min-w-0"><span className="mb-2 block text-sm font-black">Questions</span><select className="w-full rounded-xl border-2 border-violet-100 bg-white px-3 py-3 font-bold focus:border-violet-500" value={count} onChange={e=>{setCount(Number(e.target.value));reset()}}>{[5,10,15,20].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
   <button className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#ffb82e] px-4 py-3 font-black" onClick={()=>{setSeed(v=>v+1);reset()}}>↻ New Worksheet</button>
  </div>
  <div className="mt-3 flex flex-wrap gap-2">
   <button className="rounded-xl bg-violet-700 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!questions.every((_,i)=>(answers[i]??"").trim())} onClick={()=>setChecked(true)}>Check Answers</button>
   <button className="rounded-xl border border-violet-100 px-4 py-3 font-bold" onClick={()=>print("blank")}>▤ Blank PDF / Print</button>
   <button className="rounded-xl border border-violet-100 px-4 py-3 font-bold" onClick={()=>print("completed")}>Print My Answers</button>
   <button className="rounded-xl border border-violet-100 px-4 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-40" disabled={!worksheetCompleted} title={worksheetCompleted?"Print the answer key":"Complete every question and press Check Answers first"} onClick={()=>print("answer")}>Answer Key</button>
  </div>
  {!worksheetCompleted&&<p className="mt-2 text-xs font-medium text-slate-500">Answer Key is available only after completing every question and checking your answers.</p>}
 </section>
 <section className="mt-5 rounded-[1.5rem] border border-amber-200 bg-white p-5 sm:p-7 print:mt-0 print:rounded-none print:border-0 print:p-0">
  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
   <div><h2 className="text-2xl font-black">Grade 5 · {topic}</h2><p className="text-sm font-semibold">Challenge {challenge} · {count} questions</p></div>
   <p className="text-sm font-bold">Date: <span className="inline-block min-w-20 border-b border-slate-400">{new Intl.DateTimeFormat("en-GB").format(new Date())}</span></p>
  </div>
  <div className="mt-5 flex items-end gap-3"><span className="font-black">Name:</span><span className="min-h-7 flex-1 border-b border-slate-500 px-2 pb-1 font-bold">{learnerName}</span></div>
  {checked&&<div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-center font-black text-emerald-800 print:hidden">Score: {score} / {count} ({Math.round(score/count*100)}%)</div>}
  <div className="mt-5 grid gap-4 md:grid-cols-2 print:grid-cols-2">
   {questions.map((p,i)=>{const correct=normalise(answers[i]??"")===normalise(p.a);return <div key={i} className="break-inside-avoid rounded-2xl border border-violet-100 bg-white p-4">
    <div className="flex items-start gap-3">
     <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 font-black text-violet-700">{i+1}</span>
     <div className="min-w-0 flex-1">
      <p className="min-h-7 font-black leading-snug">{p.q}</p>
      {p.visual&&<p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-sky-50 p-2 text-sm">{p.visual}</p>}
      <input aria-label={`Answer to question ${i+1}`} className="mt-2 h-12 w-full rounded-xl border border-violet-200 bg-white px-3 text-base font-semibold outline-none focus:border-violet-500 print:border-slate-300" placeholder="Your answer" value={printMode==="answer"?p.a:printMode==="blank"?"":answers[i]??""} disabled={checked||printMode!==null} onChange={e=>{setAnswers(a=>({...a,[i]:e.target.value}));setChecked(false)}}/>
      {checked&&<p className={`mt-2 text-sm font-bold print:hidden ${correct?"text-emerald-700":"text-rose-700"}`}>{correct?"Correct":`Correct answer: ${p.a}`}</p>}
     </div>
    </div>
   </div>})}
  </div>
  <div className="mt-5 flex flex-wrap items-center gap-3 print:hidden">
   {checked&&<><button className="rounded-xl border border-violet-200 px-5 py-3 font-bold" onClick={()=>{setChecked(false);setAnswers({})}}>Retry</button><strong>Score: {score}/{count}</strong></>}
  </div>
  <footer className="mt-6 hidden border-t pt-3 text-center text-xs font-bold print:block">Fahi Hisaabu · The Maldives Maths Learning Hub</footer>
 </section>
 </div>
 </main>
}