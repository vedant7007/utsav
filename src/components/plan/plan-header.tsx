import type { JSX, ReactNode } from "react";
import { Rangoli } from "@/components/brand/rangoli";
import { EVENT_LABELS } from "@/lib/planner/constants";
import { formatDate } from "@/lib/planner/format";
import type { EventPlan } from "@/lib/planner/plan";

interface PlanHeaderProps {
  plan: EventPlan;
  countdown: string;
  onEdit: () => void;
  onReset: () => void;
}

/** Describes the budget rangoli for screen readers. */
function rangoliLabel(plan: EventPlan): string {
  const { lines } = plan.budget;
  const largest = lines.reduce<(typeof lines)[number] | undefined>(
    (best, line) => (best === undefined || line.amount > best.amount ? line : best),
    undefined,
  );
  return `Budget rangoli for ${plan.brief.title}: ${lines.length} categories, largest is ${
    largest?.label ?? "none"
  }.`;
}

/** The festive night band at the top of a plan: title, key details, actions and the rangoli. */
export function PlanHeader({ plan, countdown, onEdit, onReset }: PlanHeaderProps): JSX.Element {
  const { brief, budget } = plan;
  const petals = budget.lines.map(({ id, label, share }) => ({ id, label, share }));

  return (
    <div className="night-band on-night">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-12 pt-6 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="inline-block rounded-full bg-marigold px-3 py-1 font-bold text-ink">
            {EVENT_LABELS[brief.eventType]}
          </p>
          <h1
            id="plan-title"
            tabIndex={-1}
            className="display mt-4 text-5xl focus:outline-none sm:text-7xl"
          >
            {brief.title}
          </h1>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Event details">
            <Detail>
              <time dateTime={brief.date}>{formatDate(brief.date)}</time>
            </Detail>
            {brief.city && <Detail>{brief.city}</Detail>}
            <Detail>{brief.guests} guests</Detail>
            <Detail>{countdown}</Detail>
          </ul>
          <div className="no-print mt-7 flex flex-wrap gap-3">
            <button type="button" className="btn btn-sun" onClick={onEdit}>
              Edit details
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
              Print or save PDF
            </button>
            <button type="button" className="btn btn-ghost" onClick={onReset}>
              Start a new plan
            </button>
          </div>
        </div>
        <figure className="mx-auto text-marigold">
          <Rangoli
            key={plan.generatedAt}
            petals={petals}
            size={340}
            label={rangoliLabel(plan)}
            className="h-auto w-64 sm:w-80"
          />
          <figcaption className="mt-1 text-center text-sm text-white/80">
            Your budget as a rangoli: bigger petal, bigger share.
          </figcaption>
        </figure>
      </div>
    </div>
  );
}

function Detail({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-full border-2 border-white/70 px-3 py-1 font-semibold">{children}</li>
  );
}
