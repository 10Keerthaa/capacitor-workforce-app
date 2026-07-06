import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SplashScreen from "@/components/SplashScreen";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "10xWorkforce.AI | Autonomous Operations",
  description: "AI Operating System for Field Operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-[#0A0A0B] ${inter.className}`}>
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
