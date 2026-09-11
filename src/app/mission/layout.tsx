import GameMechanicsSystem from "@/components/game-mechanics-system";
import MissionAnswerBridge from "@/components/mission-answer-bridge";
import MissionCompletionSystem from "@/components/mission-completion-system";
import MissionProgressMap from "@/components/mission-progress-map";
import RewardsPersistenceSystem from "@/components/rewards-persistence-system";

export default function MissionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MissionProgressMap />
      <MissionAnswerBridge />
      <MissionCompletionSystem />
      <GameMechanicsSystem />
      <RewardsPersistenceSystem />
    </>
  );
}
