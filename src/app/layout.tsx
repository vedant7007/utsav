import type { JSX } from "react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { connection } from "next/server";
import "@fontsource-variable/bricolage-grotesque/standard.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Utsav: AI Celebration and Event Planner",
  description:
    "Plan weddings, birthdays, anniversaries and community events with an AI planner: budget splits, dated timelines, vendor checklists, run sheets, palettes and invitations.",
  applicationName: "Utsav",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1f1147",
  width: "device-width",
  initialScale: 1,
};

/**
 * Pages render per request so Next.js can apply the CSP nonce set by the proxy to its inline
 * scripts; a statically prerendered page could not carry a per-request nonce.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<JSX.Element> {
  await connection();
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <header className="night-band on-night">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/" className="flex items-center gap-2.5 text-white" aria-label="Utsav home">
              <svg aria-hidden="true" width="38" height="38" viewBox="0 0 32 32">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
                  <ellipse
                    key={angle}
                    cx="16"
                    cy="7.5"
                    rx="3.4"
                    ry="6"
                    transform={`rotate(${angle} 16 16)`}
                    fill={index % 2 === 0 ? "#c4005f" : "#ffb400"}
                    stroke="#1a1033"
                    strokeWidth="0.8"
                  />
                ))}
                <circle cx="16" cy="16" r="4.2" fill="#ffffff" stroke="#1a1033" strokeWidth="1" />
              </svg>
              <span className="display text-3xl">Utsav</span>
            </Link>
            <p className="hidden text-sm font-semibold text-white/85 sm:block">
              Weddings, birthdays, anniversaries and melas, planned with Gemini
            </p>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
        <footer className="border-t-2 border-ink bg-sun py-6 text-center text-sm font-semibold text-ink">
          <p className="mx-auto max-w-3xl px-5">
            Built for PromptWars Virtual with Google Gemini. Plans are suggestions, so confirm
            prices and availability with your vendors.
          </p>
        </footer>
      </body>
    </html>
  );
}
