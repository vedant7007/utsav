import type { IdeasSource } from "@/lib/planner/plan";
import type { AiIdeas } from "@/lib/planner/schema";

interface IdeasPanelProps {
  ideas: AiIdeas;
  source: IdeasSource;
}

const SECTIONS: { key: "decor" | "food" | "activities" | "savingTips"; title: string }[] = [
  { key: "decor", title: "Decor" },
  { key: "food", title: "Food and drinks" },
  { key: "activities", title: "Activities and moments" },
  { key: "savingTips", title: "Ways to save" },
];

/** Personalised ideas, labelled with where they came from. */
export function IdeasPanel({ ideas, source }: IdeasPanelProps) {
  return (
    <section aria-labelledby="ideas-heading" className="space-y-5">
      <div className="card p-5">
        <h3 id="ideas-heading" className="font-[family-name:var(--font-display)] text-xl font-bold text-maroon">
          Theme concept
        </h3>
        <p className="mt-2 text-lg">{ideas.themeConcept}</p>
        <p className="mt-3 text-sm text-muted">
          {source === "gemini"
            ? "Personalised by Google Gemini for your brief."
            : "Curated suggestions. Connect a Gemini API key for ideas tailored to your brief."}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.key} className="card p-5">
            <h4 className="font-bold">{section.title}</h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              {ideas[section.key].map((idea, index) => (
                <li key={`${section.key}-${index}`}>{idea}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
