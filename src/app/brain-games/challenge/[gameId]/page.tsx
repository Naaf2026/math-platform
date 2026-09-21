import { notFound } from "next/navigation";
import BrainGameChallenge from "@/components/brain-games/BrainGameChallenge";
import { gameById,gamesForCategory } from "@/lib/brain-games/catalog";
export default async function Page({params}:{params:Promise<{gameId:string}>}){const {gameId}=await params;const game=gameById(gameId);if(!game)notFound();const categoryGameIds=gamesForCategory(game.category).map(g=>g.id);return <BrainGameChallenge game={game} categoryGameIds={categoryGameIds}/>}