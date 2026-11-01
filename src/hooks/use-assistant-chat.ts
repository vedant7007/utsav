"use client";

import { useEffect, useRef, useState } from "react";
import { askAssistant } from "@/lib/client/api";
import { errorMessage, isAbortError } from "@/lib/errors";
import { LIMITS } from "@/lib/planner/constants";
import type { ChatTurn, EventBrief } from "@/lib/planner/schema";

/**
 * Trims the conversation to what the server accepts: the most recent turns, each within the
 * history length limit.
 * @param turns - full conversation so far.
 */
export function recentHistory(turns: ChatTurn[]): ChatTurn[] {
  return turns
    .slice(-LIMITS.chatHistoryMax)
    .map((turn) => ({ ...turn, content: turn.content.slice(0, LIMITS.chatReplyMax) }));
}

/**
 * Text for the polite live region: announces "thinking" and then each new reply only, so
 * screen readers never re-read the whole log.
 * @param turns - conversation so far.
 * @param busy - whether a reply is pending.
 */
export function liveAnnouncement(turns: ChatTurn[], busy: boolean): string {
  if (busy) return "Utsav is thinking.";
  const last = turns.at(-1);
  return last?.role === "assistant" ? `Utsav replied: ${last.content}` : "";
}

/**
 * Conversation state for the planning assistant, with cancellation on unmount.
 * @param brief - the event the questions are about.
 */
export function useAssistantChat(brief: EventBrief) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function send(message: string): Promise<void> {
    const text = message.trim();
    if (!text || busy) return;
    setError("");
    setBusy(true);
    const history = recentHistory(turns);
    setTurns((previous) => [...previous, { role: "user", content: text }]);
    const current = new AbortController();
    controller.current = current;
    try {
      const { reply } = await askAssistant(brief, history, text, current.signal);
      setTurns((previous) => [...previous, { role: "assistant", content: reply }]);
    } catch (caught) {
      if (!isAbortError(caught)) {
        setError(errorMessage(caught, "Utsav could not answer. Try again."));
      }
    } finally {
      setBusy(false);
    }
  }

  return { turns, busy, error, send, announcement: liveAnnouncement(turns, busy) };
}
