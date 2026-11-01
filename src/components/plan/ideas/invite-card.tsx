"use client";

import { type JSX, useState } from "react";

/** The invitation text with copy and WhatsApp share actions. */
export function InviteCard({ message }: { message: string }): JSX.Element {
  const [status, setStatus] = useState("");

  async function copyInvite(): Promise<void> {
    try {
      await navigator.clipboard.writeText(message);
      setStatus("Invitation copied.");
    } catch {
      setStatus("Copy failed. Select the text and copy it manually.");
    }
  }

  return (
    <div className="sticker grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-start">
      <div>
        <h3 className="display text-2xl">Your invitation, ready to send</h3>
        <p className="mt-3 max-w-2xl whitespace-pre-line rounded-2xl rounded-tl-sm border-2 border-ink bg-mint p-4 text-lg">
          {message}
        </p>
        <p aria-live="polite" className="mt-2 text-sm font-semibold">
          {status}
        </p>
      </div>
      <div className="no-print flex flex-wrap gap-3 md:flex-col">
        <button type="button" className="btn btn-sun" onClick={() => void copyInvite()}>
          Copy invitation
        </button>
        <a
          className="btn btn-primary"
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Share on WhatsApp
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
