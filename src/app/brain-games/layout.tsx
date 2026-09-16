import BrainTimeTracker from "@/components/brain-games/BrainTimeTracker";

export default function BrainGamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BrainTimeTracker />
    </>
  );
}
