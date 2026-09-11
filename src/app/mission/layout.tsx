import GameMechanicsSystem from "@/components/game-mechanics-system";
import RewardsPersistenceSystem from "@/components/rewards-persistence-system";

export default function MissionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GameMechanicsSystem />
      <RewardsPersistenceSystem />
    </>
  );
}
