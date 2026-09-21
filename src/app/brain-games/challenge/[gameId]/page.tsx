import { notFound } from "next/navigation";
import BrainGameChallenge from "@/components/brain-games/BrainGameChallenge";
import { gameById,gamesForCategory } from "@/lib/brain-games/catalog";
export default async function Page({params}:{params:Promise<{gameId:string}>}){const {gameId}=await params;const game=gameById(gameId);if(!game)notFound();const games=gamesForCategory(game.category);const at=games.findIndex(g=>g.id===game.id);const nextId=at>=0&&at<games.length-1?games[at+1].id:null;return <BrainGameChallenge game={game} nextId={nextId}/>}