import type { JSX } from "react";
import type { IdeasSource } from "@/lib/planner/plan";
import type { PlanIdeas } from "@/lib/planner/schema";
import { InviteCard } from "./ideas/invite-card";
import { PaletteCard } from "./ideas/palette-card";

interface IdeasPanelProps {
  ideas: PlanIdeas;
  source: IdeasSource;
}

type IdeaList = "decor" | "food" | "activities" | "savingTips";

const SECTIONS: readonly { key: IdeaList; title: string; tone: string }[] = [
  { key: "decor", title: "Decor", tone: "bg-blush" },
  { key: "food", title: "Food and drinks", tone: "bg-sun" },
  { key: "activities", title: "Activities and moments", tone: "bg-mint" },
  { key: "savingTips", title: "Ways to save", tone: "bg-paper" },
];

/** Theme palette, personalised ideas and a ready-to-send WhatsApp invitation. */
export function IdeasPanel({ ideas, source }: IdeasPanelProps): JSX.Element {
  return (
    <section aria-labelledby="ideas-heading" className="space-y-6">
      <PaletteCard ideas={ideas} source={source} />
      <div className="grid gap-5 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.key} className={`sticker p-5 ${section.tone}`}>
            <h3 className="text-xl font-extrabold">{section.title}</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              {ideas[section.key].map((idea, index) => (
                <li key={`${section.key}-${String(index)}`}>{idea}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <InviteCard message={ideas.inviteMessage} />
    </section>
  );
}
