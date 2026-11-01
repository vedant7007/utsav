import type { JSX } from "react";

/** The submit button with a polite status message while the plan is being built. */
export function SubmitBar({ busy }: { busy: boolean }): JSX.Element {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="submit"
        className="btn btn-primary text-lg"
        disabled={busy}
        aria-describedby="submit-status"
      >
        {busy ? "Planning your celebration..." : "Create my plan"}
      </button>
      <p id="submit-status" className="text-sm text-muted" aria-live="polite">
        {busy ? "Building budget, timeline, vendors and ideas. This takes a few seconds." : ""}
      </p>
    </div>
  );
}
