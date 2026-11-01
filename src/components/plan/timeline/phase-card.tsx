import type { JSX } from "react";
import { formatDate } from "@/lib/planner/format";
import type { Milestone } from "@/lib/planner/timeline";

interface PhaseCardProps {
  label: string;
  tone: string;
  milestones: Milestone[];
}

const BADGE = "ml-2 inline-block rounded-full border border-ink px-2 py-0.5 text-xs font-bold";

/** One planning phase with its dated milestones. */
export function PhaseCard({ label, tone, milestones }: PhaseCardProps): JSX.Element {
  return (
    <div className="sticker overflow-hidden">
      <h3 className={`border-b-2 border-ink px-5 py-2.5 text-lg font-extrabold ${tone}`}>
        {label}
      </h3>
      <ol className="space-y-3 p-5">
        {milestones.map((milestone) => (
          <li key={milestone.id} className="grid grid-cols-[7.5rem_1fr] gap-3">
            <time dateTime={milestone.date} className="font-bold tabular-nums text-muted">
              {formatDate(milestone.date)}
            </time>
            <p className="font-medium">
              {milestone.title}
              {milestone.rushed && (
                <span className={`${BADGE} bg-alert-soft text-alert`}>Do soon</span>
              )}
              {milestone.source === "ai" && (
                <span className={`${BADGE} bg-mint`}>AI suggestion</span>
              )}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
