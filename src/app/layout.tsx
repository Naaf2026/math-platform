import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FAHI VISSNUN Math Learning Platform",
  description: "A modern mathematics learning platform for FAHI VISSNUN Learning Institute.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
