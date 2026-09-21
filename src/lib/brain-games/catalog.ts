export type BrainGameCategoryKey = "memory" | "flexibility" | "speed" | "attention" | "problem-solving" | "adventure";
export type BrainGame = { id:string; title:string; description:string; category:BrainGameCategoryKey; reward:number; mechanic:string };

const categoryData = {
 memory:{title:"Brain Boost",icon:"🧠",accent:"from-violet-500 via-purple-500 to-indigo-600",subtitle:"Memory, number sense and recall challenges.",mechanics:["memory","sequence","pairs","recall","missing"]},
 flexibility:{title:"Brain Twist",icon:"🔄",accent:"from-emerald-400 via-teal-500 to-cyan-600",subtitle:"Switch rules, rearrange numbers and think differently.",mechanics:["switch","sequence","compare","rule","reverse"]},
 speed:{title:"Speed Rush",icon:"⚡",accent:"from-orange-400 via-amber-500 to-rose-500",subtitle:"Fast calculations and quick decisions.",mechanics:["addition","subtraction","compare","multiply","mixed"]},
 attention:{title:"Spot On!",icon:"🎯",accent:"from-cyan-400 via-sky-500 to-blue-600",subtitle:"Focus, scan and choose the exact answer.",mechanics:["odd-even","target","compare","missing","detail"]},
 "problem-solving":{title:"Puzzle Power",icon:"🧩",accent:"from-fuchsia-500 via-purple-500 to-violet-600",subtitle:"Logic, patterns and missing-value puzzles.",mechanics:["pattern","equation","logic","missing","balance"]},
 adventure:{title:"Brain Quest",icon:"🗺️",accent:"from-sky-400 via-cyan-500 to-teal-500",subtitle:"Multi-step mathematical quests and discoveries.",mechanics:["quest","mixed","path","treasure","boss"]},
} as const;

const names:Record<BrainGameCategoryKey,string[]> = {
 memory:["Memory Tiles","Flash Memory","Hidden Numbers","What's Missing?","Number Echo","Equation Recall","Pattern Memory","Quick Peek","Pair Power","Memory Ladder","Number Snapshot","Shape Recall","Sequence Keeper","Math Match","Missing Pair","Memory Grid","Recall Rush","Number Vault","Equation Cards","Pattern Vault","Memory Steps","Hidden Total","Flash Equation","Recall Order","Math Memory Mix","Number Trail","Memory Switch","Secret Sequence","Brain Snapshot","Memory Master"],
 flexibility:["Number Order","Pattern Quest","Rule Switch","Reverse It","Odd One Rule","Number Flip","Change the Rule","Two Ways","Sort Smart","Pattern Switch","Equation Flip","Build Another Way","Number Shuffle","Rule Detective","Reverse Sequence","Compare Paths","Flexible Facts","Swap the Signs","Reorder Challenge","Changing Steps","Double Rule","Number Transform","Pattern Pivot","Equation Switch","Think Again","New Route","Rule Remix","Twist the Total","Switch Master","Brain Bender"],
 speed:["Number Rush","Quick Add","Rapid Subtract","Fast Facts","Beat the Clock","Speed Compare","Lightning Sums","Turbo Numbers","Quick Multiply","Flash Divide","Ten Second Total","Rapid Order","Fast Missing Number","Quick Equation","Speed Match","Math Sprint","Number Dash","Rapid Double","Quick Half","Fast Greater Than","Speed Sequence","Lightning Logic","Rapid Mix","Quick Target","Math Blitz","Fast Pair","Speed Builder","Turbo Total","Rapid Challenge","Speed Master"],
 attention:["Even or Odd","Spot the Number","Find the Target","Exact Match","Missing Digit","Number Scan","Spot the Difference","Quick Focus","Find the Pair","Correct Sign","Tiny Detail","Number Hunt","Equation Scan","Odd One Out","Target Total","Find the Error","Spot the Pattern","Focus Grid","Match Exactly","Hidden Sign","Number Detective","Careful Compare","Spot the Missing","Sharp Eyes","Exact Order","Focus Challenge","Detail Dash","Target Finder","Accuracy Test","Spot On Master"],
 "problem-solving":["Pattern Quest","Missing Number","Logic Grid","Balance It","Equation Puzzle","Number Pyramid","Magic Total","Crack the Code","Math Maze","Rule Puzzle","Number Bridge","Logic Ladder","Missing Sign","Target Builder","Equation Chain","Pattern Grid","Number Lock","Total Puzzle","Logic Path","Smart Balance","Mystery Number","Puzzle Steps","Code Breaker","Math Riddle","Grid Master","Number Box","Logic Mix","Puzzle Trail","Final Equation","Puzzle Master"],
 adventure:["Island Quest","Treasure Numbers","Math Explorer","Lagoon Trail","Coral Challenge","Island Hopping","Treasure Map","Number Voyage","Math Expedition","Secret Island","Ocean Numbers","Path Finder","Quest of Sums","Hidden Treasure","Math Navigator","Island Puzzle","Adventure Trail","Number Compass","Coral Quest","Treasure Total","Explorer Challenge","Math Journey","Island Code","Ocean Quest","Number Adventure","Map Master","Treasure Logic","Final Voyage","Grand Quest","Brain Quest Champion"],
};

export const BRAIN_GAME_CATEGORIES = categoryData;
export const BRAIN_GAMES:BrainGame[] = (Object.keys(names) as BrainGameCategoryKey[]).flatMap(category =>
 names[category].map((title,index)=>({id:`${category}-${String(index+1).padStart(2,"0")}`,title,description:`${title}: challenge ${index+1} of 30 in ${categoryData[category].title}.`,category,reward:30+(index%3)*5,mechanic:categoryData[category].mechanics[index%5]}))
);
export const gamesForCategory=(category:BrainGameCategoryKey)=>BRAIN_GAMES.filter(g=>g.category===category);
export const gameById=(id:string)=>BRAIN_GAMES.find(g=>g.id===id);
