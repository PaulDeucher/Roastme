import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROAST ME 🔥",
  description: "AI-powered savage roast machine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
