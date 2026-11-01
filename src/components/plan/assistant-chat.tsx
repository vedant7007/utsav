"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useAssistantChat } from "@/hooks/use-assistant-chat";
import { LIMITS } from "@/lib/planner/constants";
import type { EventBrief } from "@/lib/planner/schema";

const SUGGESTIONS = [
  "How can I cut 15% from this budget?",
  "What should I do first this week?",
  "Suggest a fun welcome moment for guests",
];

interface AssistantChatProps {
  brief: EventBrief;
}

/** Conversational planning help. New replies are announced through a polite live region. */
export function AssistantChat({ brief }: AssistantChatProps) {
  const { turns, busy, error, send, announcement } = useAssistantChat(brief);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [turns]);

  function ask(message: string) {
    setDraft("");
    void send(message);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(draft);
  }

  return (
    <section aria-labelledby="assistant-heading" className="sticker p-6">
      <h2 id="assistant-heading" className="display text-3xl">
        Ask Utsav
      </h2>
      <p className="text-muted">Questions about this plan: budget trade-offs, priorities, ideas.</p>

      <ol
        ref={logRef}
        aria-label="Conversation"
        aria-busy={busy}
        className="mt-4 max-h-96 space-y-3 overflow-y-auto"
      >
        {turns.map((turn, index) => (
          <li
            key={index}
            className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 ${
              turn.role === "user"
                ? "ml-auto rounded-br-sm bg-rani text-white"
                : "rounded-bl-sm border-2 border-ink bg-sun text-ink"
            }`}
          >
            <span className="sr-only">
              {turn.role === "user" ? "You said: " : "Utsav replied: "}
            </span>
            {turn.content}
          </li>
        ))}
        {busy && (
          <li className="max-w-[85%] rounded-2xl border-2 border-ink bg-sun px-4 py-2.5 font-semibold">
            Utsav is thinking...
          </li>
        )}
      </ol>

      {turns.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Suggested questions">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => ask(suggestion)}
              className="chip hover:bg-sun"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="field-error mt-3">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <label htmlFor="assistant-input" className="sr-only">
          Your question
        </label>
        <input
          id="assistant-input"
          className="field-input"
          value={draft}
          maxLength={LIMITS.chatMessageMax}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about this plan"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
