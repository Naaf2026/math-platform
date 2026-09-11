import GameMechanicsSystem from "@/components/game-mechanics-system";
import MissionAnswerBridge from "@/components/mission-answer-bridge";
import MissionProgressMap from "@/components/mission-progress-map";
import RewardsPersistenceSystem from "@/components/rewards-persistence-system";

export default function MissionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MissionProgressMap />
      <MissionAnswerBridge />
      <GameMechanicsSystem />
      <RewardsPersistenceSystem />
    </>
  );
}
