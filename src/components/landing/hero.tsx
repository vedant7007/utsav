import type { JSX } from "react";
import { Rangoli } from "@/components/brand/rangoli";
import { BUDGET_TEMPLATES } from "@/lib/planner/budget";

const WEDDING_PETALS = BUDGET_TEMPLATES.wedding.map((category) => ({
  id: category.id,
  label: category.label,
  share: category.weight / 100,
}));

const DELIVERABLES = [
  "Budget split",
  "Dated timeline",
  "Vendor checklist",
  "Event-day run sheet",
  "Theme palette",
  "WhatsApp invite",
];

/** Landing hero: the headline on the left, a blooming budget rangoli on the right. */
export function Hero(): JSX.Element {
  return (
    <section
      aria-labelledby="hero-heading"
      className="night-band on-night no-print overflow-hidden"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.15fr_1fr]">
        <div>
          <h1 id="hero-heading" className="display text-6xl sm:text-7xl lg:text-8xl">
            Every celebration, planned to the last marigold.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/90 sm:text-xl">
            Tell Utsav about your wedding, birthday, anniversary or community mela. Gemini turns it
            into a plan you can actually run.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#planner" className="btn btn-sun text-lg">
              Start planning
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="What your plan includes">
            {DELIVERABLES.map((item) => (
              <li
                key={item}
                className="rounded-full border-2 border-white/70 px-3 py-1 text-sm font-semibold"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto text-marigold">
          <Rangoli
            petals={WEDDING_PETALS}
            size={420}
            spin
            className="h-auto w-72 sm:w-96 lg:w-[420px]"
          />
          <p className="mt-2 text-center text-sm text-white/80">
            Each petal is a slice of a real wedding budget.
          </p>
        </div>
      </div>
    </section>
  );
}
