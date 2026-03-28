import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChitGPT | Intelligent conversational AI",
  description: "Production grade AI chat application interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AmbientBackground />
        <LoadingOverlay />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
