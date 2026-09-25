"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Lightbulb } from "lucide-react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Lesson = { id:string; topic_id:string; title:string; objective:string; lesson_number:number };
type Topic = { id:string; title:string; level:string };
type LessonContent = { idea:string; steps:string[]; example:string; explanation:string; remember:string };

const content:Record<string,LessonContent> = {
  "pv-l1":{idea:"The position of a digit tells us its value.",steps:["Read the number from right to left: ones, tens, hundreds, then thousands.","A digit in the tens place counts groups of ten.","Name the place before finding the value."],example:"In 347, the 4 is in the tens place. Its value is 40.",explanation:"347 is 3 hundreds + 4 tens + 7 ones, or 300 + 40 + 7.",remember:"A digit and its value are different: 4 tens means 40."},
  "pv-l2":{idea:"Group digits into thousands, hundreds, tens and ones to read a large number.",steps:["Split the number into groups of three digits from the right.","Read the thousands group, then the remaining group.","To compare two numbers, compare the leftmost digits first."],example:"4,306 is four thousand, three hundred and six.",explanation:"4 thousands + 3 hundreds + 0 tens + 6 ones = 4,306. Since 4,306 has more thousands than 3,999, it is greater.",remember:"A zero holds an empty place so the other digits keep their values."},
  "pv-l3":{idea:"Expanded form shows what each digit is worth.",steps:["Find the place of each digit.","Write the value of every nonzero digit.","Join the values with plus signs."],example:"582 = 500 + 80 + 2.",explanation:"The 5 represents five hundreds, the 8 represents eight tens, and the 2 represents two ones.",remember:"Add the expanded parts to check that you get the original number."},
  "pv-l4":{idea:"Use place values to solve mixed number problems.",steps:["Mark the ones, tens and hundreds places.","Work from the largest place to the smallest.","Check your answer by rebuilding the number."],example:"Which is larger, 462 or 426? 462 is larger.",explanation:"Both have 4 hundreds. Compare the tens next: 6 tens is greater than 2 tens.",remember:"Compare from the left; the first different digit decides."},
  "as-l1":{idea:"Break numbers into tens and ones to add more easily.",steps:["Add the tens.","Add the ones.","Combine both parts."],example:"34 + 25 = (30 + 20) + (4 + 5) = 59.",explanation:"50 plus 9 makes 59.",remember:"You can regroup when the ones total ten or more."},
  "as-l2":{idea:"Subtraction finds how much remains or the difference between numbers.",steps:["Subtract the tens and ones when possible.","If needed, split one ten into ten ones.","Add the remaining parts to check your result."],example:"56 − 23 = (50 − 20) + (6 − 3) = 33.",explanation:"Three tens and three ones remain.",remember:"Check by adding: 33 + 23 = 56."},
  "as-l3":{idea:"Regrouping trades one ten for ten ones without changing the number.",steps:["Line up digits by place.","When there are not enough ones, trade one ten for ten ones.","Subtract the ones, then the tens."],example:"42 − 18: trade 1 ten so 42 becomes 3 tens and 12 ones. 12 − 8 = 4; 3 − 1 = 2. Answer: 24.",explanation:"3 tens and 12 ones still make 42.",remember:"A trade changes the way the number is written, not its value."},
  "as-l4":{idea:"An inverse operation helps check an answer.",steps:["Add to check subtraction, or subtract to check addition.","Estimate first to see whether the answer is sensible.","Compare the check with the original numbers."],example:"27 + 15 = 42. Check: 42 − 15 = 27.",explanation:"The subtraction takes away the 15 that was added.",remember:"An answer should also be close to your estimate."},
  "as-l5":{idea:"Choose addition for combining and subtraction for taking away or finding a difference.",steps:["Read what the problem asks.","Pick the operation and write a number sentence.","Calculate and check with the inverse."],example:"You have 18 shells and find 7 more. 18 + 7 = 25 shells.",explanation:"Finding more shells combines two amounts, so we add.",remember:"Write the answer with its unit."},
  "mul-l1":{idea:"Multiplication counts equal groups.",steps:["Count how many groups there are.","Count how many items are in each group.","Multiply or add the same amount repeatedly."],example:"3 groups of 4 shells: 4 + 4 + 4 = 12, so 3 × 4 = 12.",explanation:"Each group has the same number of shells.",remember:"The groups must be equal to use multiplication this way."},
  "mul-l2":{idea:"Known multiplication facts make new problems quicker.",steps:["Start with a fact you know.","Use equal groups, doubling or skip counting.","Check by counting the groups."],example:"6 × 4 = 24, because 4 + 4 + 4 + 4 + 4 + 4 = 24.",explanation:"Six groups with four in each group make 24.",remember:"Changing the order does not change the product: 6 × 4 = 4 × 6."},
  "mul-l3":{idea:"A difficult multiplication fact can be split into easier facts.",steps:["Split one factor into two friendly parts.","Multiply each part.","Add the two products."],example:"7 × 6 = (5 × 6) + (2 × 6) = 30 + 12 = 42.",explanation:"Seven groups are five groups plus two groups.",remember:"Splitting a factor keeps the total number of groups the same."},
  "mul-l4":{idea:"Use tens and ones for mental multiplication.",steps:["Split the larger number into tens and ones.","Multiply both parts by the other number.","Add the products."],example:"3 × 14 = (3 × 10) + (3 × 4) = 30 + 12 = 42.",explanation:"Three groups of 14 equal three groups of 10 and three groups of 4.",remember:"Estimate first to check your mental answer."},
  "mul-l5":{idea:"Look for equal groups in a story problem.",steps:["Identify the number of groups and the size of each group.","Write a multiplication sentence.","Solve and include the unit."],example:"There are 4 boats with 3 passengers in each. 4 × 3 = 12 passengers.",explanation:"Four equal groups of three make twelve.",remember:"Draw groups if you are unsure what to multiply."},
  "mul-l6":{idea:"Choose a useful multiplication strategy for each problem.",steps:["Look for equal groups.","Use a fact you know or split a factor.","Check by repeated addition or a rough estimate."],example:"8 × 7 = (4 × 7) + (4 × 7) = 28 + 28 = 56.",explanation:"Eight groups can be split into two sets of four groups.",remember:"Explain your strategy, not just your answer."},
  "fr-l1":{idea:"A fraction names equal parts of one whole.",steps:["Check that the whole is split into equal parts.","The bottom number says how many equal parts make the whole.","The top number says how many parts we have."],example:"If a pizza is cut into 4 equal slices and you take 1, you have 1/4.",explanation:"Four equal quarters make one whole pizza.",remember:"Parts must be equal for a fraction such as 1/4 to make sense."},
  "fr-l2":{idea:"Equivalent fractions describe the same amount.",steps:["Draw or imagine the same whole.","Split each part into the same number of smaller pieces.","Multiply the top and bottom by the same number."],example:"1/2 = 2/4.",explanation:"Two quarters cover exactly the same part of the whole as one half.",remember:"The size of the whole must stay the same."},
  "fr-l3":{idea:"Use equal sized wholes when comparing fractions.",steps:["Draw the fractions or use a shared denominator.","Compare how much of the whole each covers.","Use <, > or = to show the result."],example:"1/2 > 1/4.",explanation:"A half covers more of the same whole than a quarter.",remember:"With the same numerator, more equal pieces means smaller pieces."},
  "fr-l4":{idea:"Fractions can mark positions between whole numbers on a number line.",steps:["Mark 0 and 1.","Split the distance into equal intervals.","Count intervals from 0 to place the fraction."],example:"To place 3/4, divide 0 to 1 into four equal intervals and count three from 0.",explanation:"The denominator gives the number of intervals; the numerator tells how many to count.",remember:"The intervals must have equal length."},
  "fr-l5":{idea:"Pictures and number lines help us reason about fractions.",steps:["Draw the same sized whole for each fraction.","Split it into equal parts.","Shade or mark the fraction, then compare."],example:"2/3 is greater than 1/3 because two equal thirds cover more than one.",explanation:"When denominators match, compare the numerators.",remember:"A model can help you check a fraction rule."},
  "fr-l6":{idea:"Use equal parts to explain fraction answers.",steps:["Identify the whole.","Check that parts are equal.","Use a picture, number line or equivalent fraction to solve."],example:"If 3 of 6 equal pieces are shaded, the shaded part is 3/6 = 1/2.",explanation:"Three of six pieces cover half of the whole.",remember:"State what the whole is before naming its fraction."},
};

export default function LessonPage(){
  const params=useParams<{topic:string;lesson:string}>();
  const topicId=params.topic,lessonId=params.lesson;
  const [lesson,setLesson]=useState<Lesson|null>(null),[topic,setTopic]=useState<Topic|null>(null);
  const [loading,setLoading]=useState(true),[done,setDone]=useState(false),[error,setError]=useState("");
  useEffect(()=>{
    const supabase=createClient();
    if(!supabase){window.location.href="/login";return;}
    (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){window.location.href="/login";return;}
      const [{data:l,error:le},{data:t,error:te}]=await Promise.all([
        supabase.from("learning_lessons").select("id,topic_id,title,objective,lesson_number").eq("id",lessonId).eq("topic_id",topicId).maybeSingle(),
        supabase.from("learning_topics").select("id,title,level").eq("id",topicId).maybeSingle()
      ]);
      if(le||te||!l||!t)setError("This lesson is not available yet.");
      else {setLesson(l);setTopic(t);}
      setLoading(false);
    })();
  },[topicId,lessonId]);

  async function complete(){
    const supabase=createClient();
    if(!supabase)return;
    const {error:e}=await supabase.rpc("complete_learning_lesson",{p_lesson_id:lessonId});
    if(e){setError(e.message);return;}
    setDone(true);
  }
  if(loading)return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc]"><p className="font-bold text-[#071b3a]">Loading lesson…</p></main>;
  if(!lesson||!topic)return <main className="grid min-h-screen place-items-center bg-[#f7f9fc] p-6"><div className="rounded-3xl bg-white p-8 text-center"><h1 className="text-xl font-black">Lesson unavailable</h1><p className="mt-2 text-slate-500">{error}</p><Link href={`/learn/${topicId}`} className="mt-5 inline-block font-bold text-[#0d666b]">Back to topic</Link></div></main>;
  const material=content[lesson.id];
  return <main className="min-h-screen bg-[#f7f9fc]">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4"><Link href={`/learn/${topicId}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#0d666b]"><ArrowLeft size={16}/>{topic.title}</Link><span className="text-sm font-bold text-slate-500">Lesson {lesson.lesson_number}</span></div></header>
    <div className="mx-auto max-w-3xl px-5 py-8">
      {done?<section className="rounded-3xl bg-white p-8 text-center shadow-sm"><CheckCircle2 className="mx-auto text-emerald-600" size={42}/><h1 className="mt-4 text-3xl font-black text-[#071b3a]">Lesson complete</h1><p className="mt-2 text-slate-600">{lesson.title}</p><Link href={`/learn/${topicId}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#071b3a] px-5 py-3 font-bold text-white">More lessons <ArrowRight size={17}/></Link></section>:
      <article className="rounded-3xl bg-white p-6 shadow-sm sm:p-9">
        <div className="rounded-2xl bg-[#071b3a] p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-[#e2b75d]">{topic.level} · Lesson {lesson.lesson_number}</p><h1 className="mt-3 text-3xl font-black">{lesson.title}</h1><p className="mt-3 leading-7 text-slate-200">{lesson.objective}</p></div>
        {material?<><section className="mt-8"><div className="flex items-center gap-2 font-black text-[#0d666b]"><Lightbulb size={21}/>The big idea</div><p className="mt-3 text-xl leading-8 text-[#071b3a]">{material.idea}</p></section>
          <section className="mt-8"><h2 className="flex items-center gap-2 text-xl font-black text-[#071b3a]"><BookOpen size={21}/>Learn it step by step</h2><ol className="mt-4 space-y-3">{material.steps.map((step,index)=><li key={index} className="flex gap-4 rounded-2xl bg-slate-50 p-4 leading-7 text-slate-700"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d666b] font-black text-white">{index+1}</span>{step}</li>)}</ol></section>
          <section className="mt-8 rounded-2xl bg-cyan-50 p-6"><h2 className="font-black text-[#0d666b]">Worked example</h2><p className="mt-3 text-xl font-bold leading-8 text-[#071b3a]">{material.example}</p><p className="mt-3 leading-7 text-slate-700">{material.explanation}</p></section>
          <p className="mt-6 rounded-2xl bg-amber-50 p-5 leading-7 text-[#60451c]"><strong>Remember:</strong> {material.remember}</p>
          <button onClick={complete} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#0d666b] px-5 py-3 font-bold text-white">I have learned this <CheckCircle2 size={18}/></button></>:<div className="mt-8 rounded-2xl bg-slate-50 p-6 text-slate-600">Learning material for this lesson is being prepared. <Link href={`/learn/${topicId}`} className="font-bold text-[#0d666b]">Back to lessons</Link></div>}
        {error&&<p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
      </article>}
    </div>
  </main>;
}
