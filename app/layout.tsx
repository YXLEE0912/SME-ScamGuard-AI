import type { Metadata } from "next";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
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
      <body className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F17] text-neutral-900 dark:text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
