"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/client";
type Item={q:string;a:string;hint:string;visual?:string};
const topics=[
["5-digit numbers","Number Concept"],["Counting backwards through zero","Number Concept"],["Place value","Number Concept"],["Rounding to 10 or 100","Number Concept"],["Roman numerals","Number Concept"],["Skip counting","Number Concept"],
["Addition and subtraction","Addition and Subtraction"],["Multiplication","Multiplication and Division"],["Division","Multiplication and Division"],["Money (MVR)","Money"],["Negative numbers","Negative Numbers"],["Fractions","Fractions and Decimals"],["Decimals","Fractions and Decimals"],["Ordering decimals","Fractions and Decimals"],["Ratio","Ratio and Proportion"],
["Length","Measurement"],["Mass","Measurement"],["Capacity","Measurement"],["Perimeter","Perimeter, Area and Volume"],["Area","Perimeter, Area and Volume"],["Area by counting squares","Perimeter, Area and Volume"],["Time","Time"],["3-D shapes","Shape and Space"],["2-D shapes","Shape and Space"],["Directions","Positions and Directions"],["Angles","Angles"],["Handling data","Handling Data"],["Number patterns","Patterning and Algebra"]
] as const;
const roman=(n:number)=>{let out="";for(const [v,s] of [[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]] as const){while(n>=v){out+=s;n-=v}}return out};
function make(topic:string,i:number,seed:number,challenge=1):Item{
const n=i+seed*37+1,a=10000+(n*3791)%80000,b=1000+(n*197)%8000,x=2+n%11,y=2+(n*3)%9,z=1+n%7;
switch(topic){
case "Counting backwards through zero":{const step=1+n%5,start=step*(2+Math.floor(n/5)%20),term=start-step*3;return{q:`Count backwards by ${step}: ${start}, ${start-step}, ${start-2*step}, ___ .`,a:String(term),hint:"Subtract the same step each time, even when you pass zero."}}
case "5-digit numbers":return{q:`Write the number just after ${a.toLocaleString("en-US")}.`,a:String(a+1),hint:"Add one to the number."};
case "Place value":{const place=[1,10,100,1000,10000][n%5];return{q:`What is the value of digit ${Math.floor(a/place)%10} in ${a.toLocaleString("en-US")}?`,a:String(Math.floor(a/place)%10*place),hint:"Use ten thousands, thousands, hundreds, tens and ones."}}
case "Rounding to 10 or 100":{const unit=n%2?10:100;return{q:`Round ${a.toLocaleString("en-US")} to the nearest ${unit}.`,a:String(Math.round(a/unit)*unit),hint:"Look at the digit immediately to the right of the rounding place."}}
case "Roman numerals":{const v=1+n%20;return{q:`Write ${v} in Roman numerals.`,a:roman(v),hint:"I = 1, V = 5, X = 10."}}
case "Skip counting":{const step=[2,5,10,100][n%4],start=step*(2+n%15);return{q:`Complete: ${start}, ${start+step}, ___, ${start+3*step}.`,a:String(start+2*step),hint:`Add ${step} each time.`}}
case "Addition and subtraction":return n%2?{q:`${a.toLocaleString("en-US")} + ${b.toLocaleString("en-US")} = ?`,a:String(a+b),hint:"Line up digits by place value."}:{q:`${a.toLocaleString("en-US")} − ${b.toLocaleString("en-US")} = ?`,a:String(a-b),hint:"Subtract from right to left; exchange if necessary."};
case "Multiplication":{const left=challenge===1?12+n%48:challenge===2?100+n%300:1000+n%500,right=challenge===1?2+n%9:challenge===2?2+n%20:10+n%40;return{q:`${left} × ${right} = ?`,a:String(left*right),hint:"Use partitioning or a written method."}}
case "Division":{const divisor=challenge===1?x:challenge===2?x+10:x+20,quotient=challenge===1?y:challenge===2?y*3:y*11;return{q:`${divisor*quotient} ÷ ${divisor} = ?`,a:String(quotient),hint:"Use the inverse multiplication fact."}}
case "Money (MVR)":{const p=10+x*5,q=2+y*3;return{q:`A notebook costs MVR ${p} and a pencil costs MVR ${q}. How much do they cost together?`,a:String(p+q),hint:"Add the two prices in rufiyaa."}}
case "Negative numbers":{const start=-1-n%9,step=2+n%5;return{q:`The temperature is ${start}°C. It rises by ${step}°C. What is the new temperature?`,a:String(start+step),hint:"Move right on the number line."}}
case "Fractions":{const den=[2,3,4,5,8,10][n%6],num=1+Math.floor(n/6)%(den-1),multiple=2+Math.floor(n/6)%30;return{q:`What is ${num}/${den} of ${den*multiple}?`,a:String(num*multiple),hint:"Divide by the denominator, then multiply by the numerator."}}
case "Ordering decimals":{const left=(10+n%80)/10,right=(10+(n*7)%80)/10;return{q:`Write >, < or = : ${left.toFixed(1)} ___ ${right.toFixed(1)}.`,a:left>right?">":left<right?"<":"=",hint:"Compare ones first, then tenths."}}
case "Decimals":{const u=1+n%8,v=1+(n*3)%9;return{q:`${u}.${v} + 0.${v} = ?`,a:(u+v/5).toFixed(1),hint:"Align the decimal points."}}
case "Ratio":return{q:`The ratio of red to blue beads is ${x}:${y}. There are ${x*z} red beads. How many blue beads are there?`,a:String(y*z),hint:"Find the multiplier from the red beads."};
case "Length":{const cm=100+((n*37)%980);return{q:`Convert ${cm} cm into metres.`,a:String(cm/100),hint:"100 cm = 1 m."}}
case "Mass":return{q:`A bag weighs ${x} kg and ${y*100} g. What is its mass in grams?`,a:String(x*1000+y*100),hint:"1 kg = 1,000 g."};
case "Capacity":return{q:`A jug contains ${x} litres and ${y*100} mL. How many millilitres is that?`,a:String(x*1000+y*100),hint:"1 litre = 1,000 mL."};
case "Perimeter":return{q:`A rectangle is ${x+4} cm long and ${y+2} cm wide. Find its perimeter.`,a:String(2*(x+y+6)),hint:"Add all four sides."};
case "Area by counting squares":{const rows=2+n%9,columns=2+Math.floor(n/9)%12;return{q:`A rectangle covers ${rows} rows of ${columns} unit squares. What is its area in square units?`,a:String(rows*columns),hint:"Count rows × squares per row."}}
case "Area":return{q:`A rectangle is ${x+2} cm long and ${y+1} cm wide. Find its area in cm².`,a:String((x+2)*(y+1)),hint:"Area = length × width."};
case "Time":{const hour=1+n%10,min=(n%4)*15,dur=15*(1+n%3),total=hour*60+min+dur;return{q:`A lesson starts at ${hour}:${String(min).padStart(2,"0")}. It lasts ${dur} minutes. When does it end?`,a:`${Math.floor(total/60)}:${String(total%60).padStart(2,"0")}`,hint:"Add the minutes, carrying into the next hour if needed."}}
case "3-D shapes":{const names=["cubes","cuboids","triangular prisms","square-based pyramids"],features=[[6,12,8],[6,12,8],[5,9,6],[5,8,5]],k=n%4,mode=Math.floor(n/4)%3,amount=1+Math.floor(n/12)%20;return{q:`How many ${["faces","edges","vertices"][mode]} altogether do ${amount} separate ${names[k]} have?`,a:String(features[k][mode]*amount),hint:"Count the requested features of one solid, then multiply."}}
case "2-D shapes":{const shapes=[["pentagon",5],["hexagon",6],["octagon",8],["quadrilateral",4]],k=n%4,amount=1+Math.floor(n/4)%20;return{q:`How many sides altogether do ${amount} separate ${["pentagons","hexagons","octagons","quadrilaterals"][k]} have?`,a:String(shapes[k][1]*amount),hint:"Multiply the sides of one shape by the number of shapes."}}
case "Directions":{const from=["North","East","South","West"],idx=n%4,steps=1+Math.floor(n/4)%3,clock=Math.floor(n/12)%2===0;return{q:`Face ${from[idx]}. Turn ${steps*90}° ${clock?"clockwise":"anticlockwise"}. Which direction are you facing?`,a:from[(idx+(clock?steps:4-steps))%4],hint:"Use a compass rose."}}
case "Angles":{const deg=10+(n*17)%171;return{q:`Is an angle of ${deg}° acute, right, obtuse or straight?`,a:deg===90?"right":deg===180?"straight":deg<90?"acute":"obtuse",hint:"Compare with 90° and 180°."}}
case "Handling data":{const vals=[x,y,z];return{q:`A class collected ${vals[0]} shells on Monday, ${vals[1]} on Tuesday and ${vals[2]} on Wednesday. How many altogether?`,a:String(vals.reduce((t,v)=>t+v,0)),hint:"Add the values from all three days.",visual:`Mon: ${"■".repeat(x)}  Tue: ${"■".repeat(y)}  Wed: ${"■".repeat(z)}`}}
default:{const step=2+n%8,start=3+n%20;return{q:`Find the missing number: ${start}, ${start+step}, ${start+2*step}, ___, ${start+4*step}.`,a:String(start+3*step),hint:`The pattern increases by ${step}.`}}
}}
export default function Grade4Worksheets({embedded=false}:{embedded?:boolean}){
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
 <header className="mb-5 print:hidden"><h1 className="text-3xl font-black">Grade 4 Worksheets</h1><p className="text-sm font-medium">Based on Exploring Mathematics 4A &amp; 4B.</p></header>
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
   <div><h2 className="text-2xl font-black">Grade 4 · {topic}</h2><p className="text-sm font-semibold">Challenge {challenge} · {count} questions</p></div>
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