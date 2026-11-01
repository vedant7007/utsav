import { type JSX, type SubmitEvent, useState } from "react";
import { LIMITS } from "@/lib/planner/constants";

interface ChatComposerProps {
  busy: boolean;
  onAsk: (message: string) => void;
}

/** The question box. It clears after sending and cannot send while a reply is pending. */
export function ChatComposer({ busy, onAsk }: ChatComposerProps): JSX.Element {
  const [draft, setDraft] = useState("");

  function onSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (busy || draft.trim() === "") return;
    onAsk(draft);
    setDraft("");
  }

  return (
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
      <button type="submit" className="btn btn-primary" disabled={busy || draft.trim() === ""}>
        Send
      </button>
    </form>
  );
}
