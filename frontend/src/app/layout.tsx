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
  title: "ScamGuard.AI | AP Fraud & BEC Verification Platform",
  description:
    "Enterprise-grade Accounts Payable reconciliation, Master Procurement Ledger parity cross-referencing, and BEC wire interdiction for Malaysian SMEs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('scamguard_theme');
                if (storedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen antialiased bg-[#f8fafc] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 selection:bg-slate-800/10 selection:text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
