import type { Metadata } from "next";
import { Orbitron, Space_Grotesk, VT323 } from "next/font/google";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ball Knowledge",
  description: "Scoring-aware fantasy football trade analyzer",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${vt323.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ServiceWorkerRegistration />
        <AppHeader />
        {/* pb-20 keeps page content (and its primary actions) clear of the sticky bottom nav below. */}
        <main className="flex flex-1 flex-col pb-20">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
