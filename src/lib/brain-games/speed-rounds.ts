import type { SpeedGame } from "./speed-catalog";

export type Tile = { id: string; label: string; value?: number; tone?: string; height?: number };
export type Round = {
 mode: "choice" | "order" | "hunt" | "build" | "memory" | "echo" | "sort" | "path";
 prompt: string; tiles: Tile[]; answer: string[]; explanation: string;
 display?: string; visual?: "count" | "place" | "clock" | "fraction" | "domino" | "bars";
 numbers?: number[]; target?: number; pickCount?: number; bins?: string[];
 assignment?: Record<string,string>; start?: number; goal?: number; rocks?: number[];
};
export type Random = () => number;
export const shuffle = <T,>(items: T[], random: Random = Math.random): T[] => {
 const out = [...items];
 for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
 return out;
};
const tones=["rose","sky","lime","amber"];
const colours=["Red","Blue","Green","Yellow"];
const shapes=["●","▲","■","★"];
const shapeNames=["circles","triangles","squares","stars"];
const tiles=(values:(string|number)[])=>values.map((v,i)=>({id:String(i),label:String(v),...(typeof v==="number"?{value:v}:{})}));
function options(answer:number, random:Random):Tile[]{
 const values=new Set([answer]);
 for(const n of shuffle([-1,1,-2,2,3,-3,5,10],random)){if(answer+n>=0)values.add(answer+n);if(values.size===4)break;}
 return tiles(shuffle(Array.from(values),random));
}
function choice(prompt:string,answer:number,random:Random,extra:Partial<Round>={}):Round{
 const ts=options(answer,random);
 return {mode:"choice",prompt,tiles:ts,answer:[ts.find(t=>t.value===answer)!.id],explanation:`The answer is ${answer}.`,...extra};
}
export function makeSpeedRound(game:SpeedGame,level=1,roundIndex=0,random:Random=Math.random):Round{
 const n=(min:number,max:number)=>min+Math.floor(random()*(max-min+1));
 const a=n(1,level===1?9:level===2?20:40),b=n(1,level===1?9:15);
 switch(game.slug){
 case "rocket-addition": return choice("Fuel your rocket!",a+b,random,{display:`${a} + ${b}`,explanation:`${a} + ${b} = ${a+b}.`});
 case "submarine-subtraction":{const x=Math.max(a,b),y=Math.min(a,b);return choice("How many pearls remain?",x-y,random,{display:`${x} − ${y}`,explanation:`${x} − ${y} = ${x-y}.`});}
 case "pizza-doubles":return choice("Double the pizza order!",a*2,random,{display:`${a} + ${a}`,explanation:`Double ${a} is ${a*2}.`});
 case "penguin-halves":return choice("How many for each penguin?",a,random,{display:`${a*2} ÷ 2`,explanation:`Half of ${a*2} is ${a}.`});
 case "cloud-count":{const count=n(3,level===1?10:18);return choice("How many stars can you see?",count,random,{visual:"count",numbers:[count]});}
 case "balloon-order":case "comet-countdown":case "frog-skip":{
  const step=game.slug==="frog-skip"?[2,5,10][roundIndex%3]:n(1,4);
  const start=n(1,9),values=Array.from({length:level===3?6:5},(_,i)=>start+i*step);
  const ts=tiles(shuffle(values,random)),descending=game.slug==="comet-countdown";
  const expected=descending?[...values].reverse():values;
  return {mode:"order",prompt:game.slug==="frog-skip"?`Start at ${start}. Hop by ${step}!`:descending?"Tap from biggest to smallest.":"Tap from smallest to biggest.",tiles:ts,answer:expected.map(v=>ts.find(t=>t.value===v)!.id),explanation:expected.join(" → ")};
 }
 case "train-tens":{const tens=n(1,level===1?5:9),ones=n(0,9);return choice("What number is on the train?",tens*10+ones,random,{visual:"place",numbers:[tens,ones],explanation:`${tens} tens and ${ones} ones make ${tens*10+ones}.`});}
 case "robot-compare":{
  const values=shuffle(Array.from({length:4},(_,i)=>a+i*n(2,4)+i*10),random),ts=tiles(values);
  const highest=Math.max(...values);
  return {mode:"choice",prompt:"Tap the robot with the greatest number.",tiles:ts,answer:[ts.find(t=>t.value===highest)!.id],explanation:`${highest} is the greatest number.`};
 }
 case "treasure-odd":case "bee-even":{
  const even=game.slug==="bee-even",ts=tiles(shuffle(Array.from({length:9},(_,i)=>a+i),random));
  return {mode:"hunt",prompt:`Find all the ${even?"EVEN":"ODD"} numbers!`,tiles:ts,answer:ts.filter(t=>t.value!%2===(even?0:1)).map(t=>t.id),explanation:even?"Even numbers end in 0, 2, 4, 6 or 8.":"Odd numbers end in 1, 3, 5, 7 or 9."};
 }
 case "colour-dash":case "shape-safari":{
  const colour=game.slug==="colour-dash",target=n(0,3),values=shuffle([target,target,target,...Array.from({length:6},()=>n(0,3))],random);
  const ts=values.map((v,i)=>({id:String(i),label:colour?colours[v]:shapes[v],value:v,tone:tones[v]}));
  return {mode:"hunt",prompt:colour?`Catch every ${colours[target].toLowerCase()} paint drop!`:`Find all the ${shapeNames[target]}!`,tiles:ts,answer:ts.filter(t=>t.value===target).map(t=>t.id),explanation:colour?`Look for ${colours[target].toLowerCase()}.`:`Look for ${shapes[target]} shapes.`};
 }
 case "star-twins":case "fruit-memory":{
  const icons=game.slug==="star-twins"?["🌟","🌙","☀️","🪐","🌎","☄️"]:["🍓","🍇","🍊","🍉","🥝","🍒"];
  const values=icons.slice(0,level===1?3:level===2?4:6);
  return {mode:"memory",prompt:"Turn over two cards. Find every pair!",tiles:tiles(shuffle([...values,...values],random)),answer:[],explanation:"All pairs found!"};
 }
 case "drum-beats":case "firefly-flash":{
  const ts=tones.map((tone,i)=>({id:String(i),label:game.slug==="drum-beats"?["🥁","🪘","🔔","🎵"][i]:["🌟","🌙","✨","💡"][i],tone}));
  const answer=Array.from({length:Math.min(3+level-1+Math.floor(roundIndex/3),6)},()=>String(n(0,3)));
  return {mode:"echo",prompt:game.slug==="drum-beats"?"Watch the drums, then copy the beat.":"Watch the lanterns, then copy the trail.",tiles:ts,answer,explanation:"Sequence: "+answer.map(v=>Number(v)+1).join(" → ")};
 }
 case "pattern-pop":{
  const start=n(0,3),other=(start+n(1,3))%4;
  const cycle=level===1?[shapes[start],shapes[other]]:[shapes[start],shapes[start],shapes[other]];
  const seq=Array.from({length:5},(_,i)=>cycle[i%cycle.length]),correct=cycle[5%cycle.length],ts=tiles(shuffle(shapes,random));
  return {mode:"choice",prompt:"Which shape comes next?",display:seq.join("  ")+"  ?",tiles:ts,answer:[ts.find(t=>t.label===correct)!.id],explanation:`The repeating group is ${cycle.join(" ")}. Next is ${correct}.`};
 }
 case "missing-carriage":{
  const step=level===1?1:[2,5,10][roundIndex%3],start=n(1,20),missing=n(1,3);
  const values=Array.from({length:5},(_,i)=>start+i*step);
  return choice("Fill the empty train carriage.",values[missing],random,{display:values.map((v,i)=>i===missing?"?":String(v)).join("  •  "),explanation:`Count by ${step}: ${values.join(", ")}.`});
 }
 case "rainbow-sort":{
  const values=shuffle([0,1,2,3,0,1,2,3],random),ts=values.map((v,i)=>({id:String(i),label:colours[v],tone:tones[v]}));
  return {mode:"sort",prompt:"Put each toy into its colour basket.",tiles:ts,answer:[],bins:colours,assignment:Object.fromEntries(ts.map(t=>[t.id,t.label])),explanation:"Every toy is in its matching basket."};
 }
 case "banana-bonds":case "bridge-builder":{
  const x=n(1,9),y=n(1,9),target=x+y;
  const ts=tiles(shuffle([x,y,n(1,9),n(1,9),n(1,9),n(1,9)],random));
  return {mode:"build",prompt:game.slug==="banana-bonds"?`Pick TWO bunches to make ${target} bananas.`:`Pick TWO blocks to build ${target}.`,target,pickCount:2,tiles:ts,answer:[],explanation:`${x} + ${y} = ${target}. Other correct pairs work too!`};
 }
 case "coin-catcher":{
  const values=shuffle([1,1,2,2,5,5,10],random),target=values[0]+values[1]+values[2];
  return {mode:"build",prompt:`Make exactly ${target} coins.`,tiles:tiles(values),target,answer:[],explanation:`Choose coins with a total of ${target}.`};
 }
 case "clock-sprint":{
  const hour=n(1,12),minute=level===1?0:level===2?[0,30][n(0,1)]:[0,15,30,45][n(0,3)];
  const label=(h:number,m:number)=>`${h}:${String(m).padStart(2,"0")}`;
  const correct=label(hour,minute),ts=tiles(shuffle([correct,label(hour%12+1,minute),label((hour+10)%12+1,minute),label(hour,(minute+30)%60)],random));
  return {mode:"choice",prompt:"What time is it?",visual:"clock",numbers:[hour,minute],tiles:ts,answer:[ts.find(t=>t.label===correct)!.id],explanation:`The clock shows ${correct}.`};
 }
 case "fraction-feast":{
  const denominator=level===1?2:level===2?4:8,numerator=n(1,denominator-1);
  const correct=`${numerator}/${denominator}`,ts=tiles(shuffle([correct,`0/${denominator}`,`${denominator}/${denominator}`,`${numerator}/${denominator*2}`],random));
  return {mode:"choice",prompt:"What fraction of the pizza is coloured?",visual:"fraction",numbers:[numerator,denominator],tiles:ts,answer:[ts.find(t=>t.label===correct)!.id],explanation:`${numerator} coloured pieces out of ${denominator} equal pieces: ${correct}.`};
 }
 case "monster-measure":{
  const values=shuffle([2,3,4,5],random),shortest=roundIndex%2===1;
  const ts=values.map((v,i)=>({id:String(i),label:["Pip","Bo","Zig","Momo"][i],height:v,value:v,tone:tones[i]})),target=shortest?2:5;
  return {mode:"choice",prompt:`Who is the ${shortest?"shortest":"tallest"} monster?`,visual:"bars",tiles:ts,answer:[ts.find(t=>t.value===target)!.id],explanation:`${ts.find(t=>t.value===target)!.label} is the ${shortest?"shortest":"tallest"}.`};
 }
 case "domino-dash":{const x=n(0,6),y=n(0,6);return choice("How many dots altogether?",x+y,random,{visual:"domino",numbers:[x,y]});}
 case "arrow-adventure":{
  // The middle row is always open, so every generated maze has a route.
  const goal=[2,5,8][n(0,2)],rocks=shuffle([0,1,6,7],random).slice(0,level);
  return {mode:"path",prompt:"Guide the turtle to the flag. Avoid the rocks!",tiles:[],answer:[],start:3,goal,rocks,explanation:"You reached the flag!"};
 }
 case "meteor-mix":{
  const kind=roundIndex%3;
  const answer=kind===0?a+b:kind===1?Math.max(a,b)-Math.min(a,b):a*2;
  const display=kind===0?`${a} + ${b}`:kind===1?`${Math.max(a,b)} − ${Math.min(a,b)}`:`${a} × 2`;
  return choice("Complete the meteor mission!",answer,random,{display,explanation:`${display} = ${answer}.`});
 }
 default: throw new Error("Unknown Speed Rush game: "+game.slug);
 }
}
export function isBuildComplete(round:Round,ids:string[]):boolean{
 if(new Set(ids).size!==ids.length || !ids.length || (round.pickCount!==undefined&&ids.length!==round.pickCount))return false;
 const chosen=ids.map(id=>round.tiles.find(t=>t.id===id));
 return chosen.every(Boolean)&&chosen.reduce((sum,t)=>sum+(t!.value??0),0)===round.target;
}
export function moveOnPath(position:number,direction:string,rocks:number[]):number{
 const row=Math.floor(position/3),col=position%3;
 const next=direction==="up"?(row>0?position-3:position):direction==="down"?(row<2?position+3:position):direction==="left"?(col>0?position-1:position):direction==="right"?(col<2?position+1:position):position;
 return rocks.includes(next)?position:next;
}
