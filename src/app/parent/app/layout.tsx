import type { Metadata } from "next";
import ParentPwaRegistration from "@/components/parent-pwa-registration";

export const metadata: Metadata = {
  title: "Fahi Hisaabu Parent",
  description: "Your child's learning, progress and revision in one place.",
  manifest: "/parent-app.webmanifest",
  appleWebApp: { capable: true, title: "Fahi Parent", statusBarStyle: "default" },
  icons: { icon: "/parent-app-icon-192.png", apple: "/parent-app-icon-192.png" },
};

export default function ParentAppLayout({ children }: { children: React.ReactNode }) {
  return <><ParentPwaRegistration />{children}</>;
}
