import { type JSX, useEffect, useRef } from "react";
import type { ChatTurn } from "@/lib/planner/schema";

const BUBBLE = "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5";
const USER_BUBBLE = `${BUBBLE} ml-auto rounded-br-sm bg-rani text-white`;
const UTSAV_BUBBLE = `${BUBBLE} rounded-bl-sm border-2 border-ink bg-sun text-ink`;

interface ChatLogProps {
  turns: ChatTurn[];
  busy: boolean;
}

/** The conversation, newest message scrolled into view. Each turn says who is speaking. */
export function ChatLog({ turns, busy }: ChatLogProps): JSX.Element {
  const logRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [turns]);

  return (
    <ol
      ref={logRef}
      aria-label="Conversation"
      aria-busy={busy}
      className="mt-4 max-h-96 space-y-3 overflow-y-auto"
    >
      {turns.map((turn, index) => {
        const fromUser = turn.role === "user";
        return (
          // Turns are append-only and never reordered, so the position is a stable key.
          <li key={index} className={fromUser ? USER_BUBBLE : UTSAV_BUBBLE}>
            <span className="sr-only">{fromUser ? "You said: " : "Utsav replied: "}</span>
            {turn.content}
          </li>
        );
      })}
      {busy && <li className={`${UTSAV_BUBBLE} font-semibold`}>Utsav is thinking...</li>}
    </ol>
  );
}
