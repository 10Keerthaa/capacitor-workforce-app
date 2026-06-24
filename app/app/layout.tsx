import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen bg-[#0A0A0B]">
        {children}
      </body>
    </html>
  );
}
