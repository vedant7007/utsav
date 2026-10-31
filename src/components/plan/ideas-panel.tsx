"use client";

import { useState } from "react";
import type { IdeasSource } from "@/lib/planner/plan";
import type { PlanIdeas } from "@/lib/planner/schema";

interface IdeasPanelProps {
  ideas: PlanIdeas;
  source: IdeasSource;
}

const SECTIONS: {
  key: "decor" | "food" | "activities" | "savingTips";
  title: string;
  tone: string;
}[] = [
  { key: "decor", title: "Decor", tone: "bg-blush" },
  { key: "food", title: "Food and drinks", tone: "bg-sun" },
  { key: "activities", title: "Activities and moments", tone: "bg-mint" },
  { key: "savingTips", title: "Ways to save", tone: "bg-paper" },
];

/**
 * Picks ink or white text for a swatch so its label stays readable (WCAG relative luminance).
 * @param hex - #RRGGBB colour.
 */
export function readableTextOn(hex: string): "#1a1033" | "#ffffff" {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  // Contrast against white versus against ink (#1a1033, luminance ~0.012).
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.062 ? "#ffffff" : "#1a1033";
}

/** Theme palette, personalised ideas and a ready-to-send WhatsApp invitation. */
export function IdeasPanel({ ideas, source }: IdeasPanelProps) {
  const [copied, setCopied] = useState("");

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(ideas.inviteMessage);
      setCopied("Invitation copied.");
    } catch {
      setCopied("Copy failed. Select the text and copy it manually.");
    }
  }

  return (
    <section aria-labelledby="ideas-heading" className="space-y-6">
      <div className="sticker p-6">
        <h2 id="ideas-heading" className="display text-3xl">
          Theme palette
        </h2>
        <p className="mt-1 text-lg">{ideas.themeConcept}</p>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Colour palette">
          {ideas.palette.map((swatch) => (
            <li
              key={swatch.hex + swatch.name}
              className="flex min-h-28 flex-col justify-end rounded-2xl border-2 border-ink p-3"
              style={{ backgroundColor: swatch.hex, color: readableTextOn(swatch.hex) }}
            >
              <span className="font-extrabold leading-tight">{swatch.name}</span>
              <span className="text-sm font-semibold uppercase tabular-nums">{swatch.hex}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          {source === "gemini"
            ? "Personalised by Google Gemini for your brief."
            : "Curated suggestions. Connect a Gemini API key for ideas tailored to your brief."}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.key} className={`sticker p-5 ${section.tone}`}>
            <h3 className="text-xl font-extrabold">{section.title}</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              {ideas[section.key].map((idea, index) => (
                <li key={`${section.key}-${index}`}>{idea}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="sticker grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <h3 className="display text-2xl">Your invitation, ready to send</h3>
          <p className="mt-3 max-w-2xl whitespace-pre-line rounded-2xl rounded-tl-sm border-2 border-ink bg-mint p-4 text-lg">
            {ideas.inviteMessage}
          </p>
          <p aria-live="polite" className="mt-2 text-sm font-semibold">
            {copied}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-3 md:flex-col">
          <button type="button" className="btn btn-sun" onClick={() => void copyInvite()}>
            Copy invitation
          </button>
          <a
            className="btn btn-primary"
            href={`https://wa.me/?text=${encodeURIComponent(ideas.inviteMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Share on WhatsApp
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
