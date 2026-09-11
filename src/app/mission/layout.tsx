import GameMechanicsSystem from "@/components/game-mechanics-system";
import MissionAnswerBridge from "@/components/mission-answer-bridge";
import MissionCompletionSystem from "@/components/mission-completion-system";
import MissionProgressMap from "@/components/mission-progress-map";
import MissionQuestionPopup from "@/components/mission-question-popup";
import RewardsPersistenceSystem from "@/components/rewards-persistence-system";

export default function MissionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MissionProgressMap />
      <MissionQuestionPopup />
      <MissionAnswerBridge />
      <MissionCompletionSystem />
      <GameMechanicsSystem />
      <RewardsPersistenceSystem />
    </>
  );
}
