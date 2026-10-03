import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SME-ScamGuard-AI | Autonomous SOC & BEC Defense Platform",
  description:
    "Deterministic local-first multi-agent defense system against SME Business Email Compromise, invoice redirection fraud, and social engineering.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen antialiased bg-[#0B111E] text-[#F1F5F9] selection:bg-[#C5A880]/20 selection:text-[#F1F5F9]`}
      >
        {children}
      </body>
    </html>
  );
}
