"use client";

import type { JSX } from "react";
import { useAssistantChat } from "@/hooks/use-assistant-chat";
import type { EventBrief } from "@/lib/planner/schema";
import { ChatComposer } from "./assistant/chat-composer";
import { ChatLog } from "./assistant/chat-log";

const SUGGESTIONS = [
  "How can I cut 15% from this budget?",
  "What should I do first this week?",
  "Suggest a fun welcome moment for guests",
];

interface AssistantChatProps {
  brief: EventBrief;
}

/** Conversational planning help. New replies are announced through a polite live region. */
export function AssistantChat({ brief }: AssistantChatProps): JSX.Element {
  const { turns, busy, error, send, announcement } = useAssistantChat(brief);
  const ask = (message: string): void => {
    void send(message);
  };

  return (
    <section aria-labelledby="assistant-heading" className="sticker p-6">
      <h2 id="assistant-heading" className="display text-3xl">
        Ask Utsav
      </h2>
      <p className="text-muted">Questions about this plan: budget trade-offs, priorities, ideas.</p>

      <ChatLog turns={turns} busy={busy} />

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

      {error !== "" && (
        <p role="alert" className="field-error mt-3">
          {error}
        </p>
      )}

      <ChatComposer busy={busy} onAsk={ask} />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
