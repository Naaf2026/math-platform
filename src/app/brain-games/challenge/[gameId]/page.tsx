import { notFound } from "next/navigation";
import BrainGameChallenge from "@/components/brain-games/BrainGameChallenge";
import BrainBoostGame from "@/components/brain-games/BrainBoostGame";
import BrainTwistGame from "@/components/brain-games/BrainTwistGame";
import { gameById,gamesForCategory } from "@/lib/brain-games/catalog";
export default async function Page({params}:{params:Promise<{gameId:string}>}){
 const {gameId}=await params;
 const game=gameById(gameId);
 if(!game)notFound();
 if(game.category==="memory" && /^memory-(0[3-9]|[12][0-9]|30)$/.test(gameId)){
   return <BrainBoostGame gameId={gameId as any}/>;
 }
 if(game.category==="flexibility" && /^flexibility-(0[3-9]|[12][0-9]|30)$/.test(gameId)){
   return <BrainTwistGame gameId={gameId as any}/>;
 }
 const categoryGameIds=gamesForCategory(game.category).map(g=>g.id);
 return <BrainGameChallenge game={game} categoryGameIds={categoryGameIds}/>;
}