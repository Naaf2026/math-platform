import type { Metadata } from "next";
import "./globals.css";
import RoleNavigation from "@/components/role-navigation";
import SoundCelebrationSystem from "@/components/sound-celebration-system";
import GameMechanicsSystem from "@/components/game-mechanics-system";
import RewardsPersistenceSystem from "@/components/rewards-persistence-system";

export const metadata: Metadata = {
  title: "FAHI VISSNUN Math Learning Platform",
  description: "A modern mathematics learning platform for FAHI VISSNUN Learning Institute.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <RoleNavigation />
        <SoundCelebrationSystem />
        <GameMechanicsSystem />
        <RewardsPersistenceSystem />
      </body>
    </html>
  );
}
