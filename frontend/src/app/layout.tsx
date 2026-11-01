import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/shell/Shell";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: "SME-ScamGuard-AI | Accounts Payable Fraud & BEC Verification Cockpit",
  description:
    "Enterprise-grade Accounts Payable reconciliation, Master Procurement Ledger parity cross-referencing, and BEC wire interdiction for Malaysian SMEs.",
};

const themeScript = `try{var t=localStorage.getItem("scamguard_theme");if(!t)t=localStorage.getItem("docuverify-theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.setAttribute("data-theme","dark")}else{document.documentElement.classList.remove("dark");document.documentElement.setAttribute("data-theme","light")}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen antialiased bg-[var(--paper)] text-[var(--ink)]`}
      >
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
