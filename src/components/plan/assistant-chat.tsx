"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { askAssistant } from "@/lib/client/api";
import { LIMITS } from "@/lib/planner/constants";
import type { ChatTurn, EventBrief } from "@/lib/planner/schema";

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
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLOListElement>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [turns]);

  async function send(message: string) {
    const text = message.trim();
    if (!text || busy) return;
    setError("");
    setBusy(true);
    setDraft("");
    // Send only recent turns, each within the server's history limit.
    const history = turns
      .slice(-LIMITS.chatHistoryMax)
      .map((turn) => ({ ...turn, content: turn.content.slice(0, LIMITS.chatReplyMax) }));
    setTurns((previous) => [...previous, { role: "user", content: text }]);
    controller.current = new AbortController();
    try {
      const { reply } = await askAssistant(brief, history, text, controller.current.signal);
      setTurns((previous) => [...previous, { role: "assistant", content: reply }]);
    } catch (caught) {
      if ((caught as Error).name !== "AbortError") setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
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
              onClick={() => void send(suggestion)}
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
        {busy
          ? "Utsav is thinking."
          : turns.at(-1)?.role === "assistant"
            ? `Utsav replied: ${turns.at(-1)?.content}`
            : ""}
      </p>
    </section>
  );
}
