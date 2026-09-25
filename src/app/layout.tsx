import type { Metadata } from "next";
import "./globals.css";
import RoleNavigation from "@/components/role-navigation";
import SoundCelebrationSystem from "@/components/sound-celebration-system";
import DailyMissionRewardOverlay from "@/components/daily-mission-reward-overlay";

export const metadata: Metadata = {
  title: "Fahi Hisaabu | The Maldives Maths Learning Hub",
  description: "Learn Maths. Play Smart. Grow Confident. The Maldives Maths Learning Hub.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <RoleNavigation />
        {children}
        <SoundCelebrationSystem />
        <DailyMissionRewardOverlay />
      </body>
    </html>
  );
}
