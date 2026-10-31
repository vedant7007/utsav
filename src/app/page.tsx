import { PlannerApp } from "@/components/planner/planner-app";
import { todayIso } from "@/lib/planner/format";

const FEATURES = [
  { title: "Smart budget", text: "A category split for your event type, tilted towards what matters to you, with a spend tracker." },
  { title: "Dated timeline", text: "Every milestone scheduled back from your date, rushed tasks flagged, exportable to any calendar." },
  { title: "Vendor checklist", text: "What to ask and confirm with each vendor, with progress you can tick off." },
  { title: "Personal ideas", text: "Theme, decor, food and activities from Google Gemini, tuned to your brief and budget." },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="hero-heading" className="no-print">
        <h1 id="hero-heading" className="font-[family-name:var(--font-display)] text-4xl font-bold text-maroon sm:text-5xl">
          Plan the celebration, enjoy the moment.
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Utsav turns a few details about your wedding, birthday, anniversary or community event into
          a complete plan: budget, timeline, vendor checklist and ideas made for you.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="card p-4">
              <h2 className="font-bold text-ink">{feature.title}</h2>
              <p className="mt-1 text-sm text-muted">{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>
      <PlannerApp today={todayIso()} />
    </div>
  );
}
