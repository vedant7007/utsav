import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Utsav: AI Celebration and Event Planner",
  description:
    "Plan weddings, birthdays, anniversaries and community events with an AI planner: budget splits, dated timelines, vendor checklists and personalised ideas.",
  applicationName: "Utsav",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#7a1f2b",
  width: "device-width",
  initialScale: 1,
};

/**
 * Pages render per request so Next.js can apply the CSP nonce set by the proxy to its inline
 * scripts; a statically prerendered page could not carry a per-request nonce.
 */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <header className="border-b border-line bg-paper">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-maroon" aria-label="Utsav home">
              <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="15" fill="#f2a900" />
                <circle cx="16" cy="16" r="8" fill="#7a1f2b" />
                <circle cx="16" cy="16" r="3" fill="#fff8ee" />
              </svg>
              <span className="font-[family-name:var(--font-display)] text-2xl font-bold">Utsav</span>
            </Link>
            <p className="hidden text-sm text-muted sm:block">AI planner for every celebration</p>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 focus:outline-none">
          {children}
        </main>
        <footer className="border-t border-line py-6 text-center text-sm text-muted">
          <p>
            Built for PromptWars Virtual with Google Gemini. Plans are suggestions; confirm prices and
            availability with vendors.
          </p>
        </footer>
      </body>
    </html>
  );
}
