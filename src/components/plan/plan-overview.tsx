import { formatDate, formatMoney } from "@/lib/planner/format";
import type { EventPlan } from "@/lib/planner/plan";

interface PlanOverviewProps {
  plan: EventPlan;
  countdown: string;
  today: string;
  tasks: { completed: number; total: number };
}

/** The overview tab: AI summary, theme, palette strip and four headline facts. */
export function PlanOverview({ plan, countdown, today, tasks }: PlanOverviewProps) {
  const { budget, timeline, ideas } = plan;
  const nextUp = timeline.milestones.find((milestone) => milestone.date >= today);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="sticker p-6">
        <h2 className="display text-3xl">Your plan at a glance</h2>
        <p className="mt-3 text-lg">{ideas.summary}</p>
        <p className="mt-4 rounded-2xl bg-sun p-4">
          <span className="font-bold">Theme concept: </span>
          {ideas.themeConcept}
        </p>
        <div
          className="mt-5 flex h-10 overflow-hidden rounded-full border-2 border-ink"
          aria-hidden="true"
        >
          {ideas.palette.map((swatch) => (
            <span
              key={swatch.hex + swatch.name}
              className="flex-1"
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-4">
        <Fact term="Countdown" value={countdown} tone="bg-blush" />
        <Fact term="Budget" value={formatMoney(budget.total, budget.currency)} tone="bg-sun" />
        <Fact
          term="Vendor tasks"
          value={`${tasks.completed} of ${tasks.total} done`}
          tone="bg-mint"
        />
        <Fact
          term="Next milestone"
          value={nextUp ? `${nextUp.title} (${formatDate(nextUp.date)})` : "All set"}
          tone="bg-paper"
        />
      </dl>
    </div>
  );
}

function Fact({ term, value, tone }: { term: string; value: string; tone: string }) {
  return (
    <div className={`sticker-sm p-4 ${tone}`}>
      <dt className="text-sm font-bold text-muted">{term}</dt>
      <dd className="mt-1 text-lg font-bold leading-snug">{value}</dd>
    </div>
  );
}
