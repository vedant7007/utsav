import type { JSX } from "react";
import { readableTextOn } from "@/lib/planner/color";
import type { IdeasSource } from "@/lib/planner/plan";
import type { PlanIdeas } from "@/lib/planner/schema";

interface PaletteCardProps {
  ideas: PlanIdeas;
  source: IdeasSource;
}

/** Theme concept and colour swatches, each labelled in a colour that stays readable. */
export function PaletteCard({ ideas, source }: PaletteCardProps): JSX.Element {
  return (
    <div className="sticker p-6">
      <h2 id="ideas-heading" className="display text-3xl">
        Theme palette
      </h2>
      <p className="mt-1 text-lg">{ideas.themeConcept}</p>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Colour palette">
        {ideas.palette.map((swatch) => (
          <li
            key={swatch.hex + swatch.name}
            className="flex min-h-28 flex-col justify-end rounded-2xl border-2 border-ink p-3"
            style={{ backgroundColor: swatch.hex, color: readableTextOn(swatch.hex) }}
          >
            <span className="font-extrabold leading-tight">{swatch.name}</span>
            <span className="text-sm font-semibold uppercase tabular-nums">{swatch.hex}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        {source === "gemini"
          ? "Personalised by Google Gemini for your brief."
          : "Curated suggestions. Connect a Gemini API key for ideas tailored to your brief."}
      </p>
    </div>
  );
}
