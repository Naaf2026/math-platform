import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
async function readModule(path){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));}
const {SPEED_GAMES}=await readModule('../src/lib/brain-games/speed-catalog.ts');
const {makeSpeedRound,isBuildComplete,moveOnPath}=await readModule('../src/lib/brain-games/speed-rounds.ts');
let seed=23092026;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('30 unique games, routes and artwork files',()=>{assert.equal(SPEED_GAMES.length,30);for(const key of ['id','slug','image'])assert.equal(new Set(SPEED_GAMES.map(g=>g[key])).size,30);});
for(const game of SPEED_GAMES)test(game.title+' generates solvable rounds at every level',()=>{
 for(let level=1;level<=3;level++)for(let i=0;i<100;i++){
  const r=makeSpeedRound(game,level,i%8,random),ids=r.tiles.map(t=>t.id);
  assert.equal(new Set(ids).size,ids.length);assert.ok(r.prompt);assert.ok(r.explanation);
  for(const id of r.answer)assert.ok(ids.includes(id));
  if(r.mode==='choice'){assert.equal(r.answer.length,1);assert.equal(new Set(r.tiles.map(t=>t.label)).size,r.tiles.length);}
  if(r.mode==='order'){assert.equal(r.answer.length,r.tiles.length);assert.equal(new Set(r.answer).size,r.answer.length);const values=r.answer.map(id=>r.tiles.find(t=>t.id===id).value);const sorted=[...values].sort((a,b)=>game.slug==='comet-countdown'?b-a:a-b);assert.deepEqual(values,sorted);}
  if(r.mode==='hunt'){assert.ok(r.answer.length>0);if(game.slug==='bee-even'||game.slug==='treasure-odd')for(const t of r.tiles)assert.equal(r.answer.includes(t.id),t.value%2===(game.slug==='bee-even'?0:1));}
  if(r.mode==='build'){let found=false;for(let mask=1;mask<(1<<r.tiles.length);mask++){const selected=ids.filter((_,j)=>mask&(1<<j));if(isBuildComplete(r,selected)){found=true;assert.equal(selected.reduce((s,id)=>s+r.tiles.find(t=>t.id===id).value,0),r.target);}}assert.ok(found);assert.equal(isBuildComplete(r,[ids[0],ids[0]]),false);assert.equal(isBuildComplete(r,['missing']),false);}
  if(r.mode==='memory'){const counts=r.tiles.reduce((m,t)=>m.set(t.label,(m.get(t.label)||0)+1),new Map());for(const count of counts.values())assert.equal(count,2);}
  if(r.mode==='sort')for(const id of ids)assert.ok(r.bins.includes(r.assignment[id]));
  if(r.mode==='path'){const visited=new Set([r.start]),queue=[r.start];while(queue.length){const pos=queue.shift();for(const dir of ['up','down','left','right']){const next=moveOnPath(pos,dir,r.rocks);assert.ok(next>=0&&next<9);assert.ok(!r.rocks.includes(next));if(!visited.has(next)){visited.add(next);queue.push(next);}}}assert.ok(visited.has(r.goal));}
  if(r.visual==='fraction')assert.ok(r.numbers[0]>0&&r.numbers[0]<r.numbers[1]);
 }
});
test('maze edges do not wrap',()=>{assert.equal(moveOnPath(2,'right',[]),2);assert.equal(moveOnPath(3,'left',[]),3);assert.equal(moveOnPath(1,'down',[4]),1);});
