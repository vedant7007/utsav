import { buildChecklist, checklistProgress } from "@/lib/planner/checklist";
import { formatDate, formatMoney, formatPercent, todayIso } from "@/lib/planner/format";
import { buildIcs, escapeIcsText, foldIcsLine } from "@/lib/planner/ics";
import { curatedIdeas } from "@/lib/planner/ideas";
import { buildPlan, validateEventDate } from "@/lib/planner/plan";
import { sampleBriefs } from "@/lib/planner/samples";
import { aiIdeasSchema, cleanText, eventBriefSchema, fieldErrors } from "@/lib/planner/schema";
import { buildTimeline } from "@/lib/planner/timeline";
import { makeBrief, TODAY } from "../fixtures";

describe("eventBriefSchema", () => {
  it("accepts a valid brief and fills defaults", () => {
    const result = eventBriefSchema.parse({
      eventType: "birthday",
      title: "Party",
      date: "2027-01-10",
      guests: "12",
      budget: "5000",
    });
    expect(result).toMatchObject({
      guests: 12,
      budget: 5000,
      currency: "INR",
      priorities: [],
      notes: "",
    });
  });

  it("cleans control characters and extra whitespace from text", () => {
    expect(cleanText("  Hello\u0000\u0007   world \n ")).toBe("Hello world");
  });

  it("rejects impossible dates, bad numbers and unknown enums", () => {
    const result = eventBriefSchema.safeParse({
      eventType: "funeral",
      title: "  ",
      date: "2027-02-30",
      guests: 1.5,
      budget: 0,
      currency: "JPY",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(Object.keys(errors)).toEqual(
        expect.arrayContaining(["eventType", "title", "date", "guests", "budget", "currency"]),
      );
      expect(errors.date).toBe("Enter a real calendar date");
    }
  });

  it("asks for a date when it is empty", () => {
    const result = eventBriefSchema.safeParse({ ...makeBrief(), date: "" });
    expect(!result.success && fieldErrors(result.error).date).toBe("Choose the event date");
  });

  it("limits priorities to three and removes duplicates", () => {
    expect(
      eventBriefSchema.safeParse({
        ...makeBrief(),
        priorities: ["food", "decor", "venue", "attire"],
      }).success,
    ).toBe(false);
    expect(
      eventBriefSchema.parse({ ...makeBrief(), priorities: ["food", "food"] }).priorities,
    ).toEqual(["food"]);
  });

  it("caps free-text length", () => {
    expect(eventBriefSchema.safeParse({ ...makeBrief(), notes: "x".repeat(501) }).success).toBe(
      false,
    );
  });
});

describe("validateEventDate", () => {
  it("rejects past dates and dates beyond two years", () => {
    expect(validateEventDate("2026-10-31", TODAY)).toMatch(/today or later/);
    expect(validateEventDate("2029-01-01", TODAY)).toMatch(/two years/);
    expect(validateEventDate(TODAY, TODAY)).toBeNull();
  });
});

describe("buildChecklist", () => {
  it("adds a dietary task to food vendors when notes mention dietary needs", () => {
    const groups = buildChecklist("birthday", 20, "Two kids have nut allergies");
    const caterer = groups.find((group) => group.id === "caterer");
    expect(caterer?.tasks.at(-1)?.text).toMatch(/dietary/);
    const plain = buildChecklist("birthday", 20, "");
    expect(plain.find((group) => group.id === "caterer")?.tasks.length).toBe(
      (caterer?.tasks.length ?? 0) - 1,
    );
  });

  it("includes security only for large events and gives every task a unique id", () => {
    expect(buildChecklist("community", 50, "").some((group) => group.id === "security")).toBe(
      false,
    );
    const large = buildChecklist("community", 500, "");
    expect(large.some((group) => group.id === "security")).toBe(true);
    const ids = large.flatMap((group) => group.tasks.map((task) => task.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reports progress", () => {
    const groups = buildChecklist("anniversary", 30, "");
    const first = groups[0]?.tasks[0]?.id ?? "";
    const progress = checklistProgress(groups, new Set([first, "unknown"]));
    expect(progress.completed).toBe(1);
    expect(progress.percent).toBe(Math.round((1 / progress.total) * 100));
    expect(checklistProgress([], new Set()).percent).toBe(0);
  });
});

describe("format helpers", () => {
  it("formats Indian currency with lakh grouping", () => {
    expect(formatMoney(150000, "INR")).toBe("₹1,50,000");
    expect(formatMoney(1500, "USD")).toBe("$1,500");
  });

  it("formats dates in UTC and percentages", () => {
    expect(formatDate("2027-02-14")).toBe("Sun, 14 Feb 2027");
    expect(formatPercent(0.284)).toBe("28%");
  });

  it("computes today in India time", () => {
    expect(todayIso("Asia/Kolkata", new Date("2026-10-31T19:00:00Z"))).toBe("2026-11-01");
  });
});

describe("buildIcs", () => {
  it("escapes special characters and folds long lines", () => {
    expect(escapeIcsText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
    const folded = foldIcsLine(`SUMMARY:${"x".repeat(100)}`);
    expect(folded.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75)).toBe(
      true,
    );
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"x".repeat(100)}`);
  });

  it("creates one all-day event per milestone", () => {
    const timeline = buildTimeline("birthday", "2026-12-01", 10, TODAY);
    const ics = buildIcs("Aarav, 8", timeline.milestones, new Date("2026-11-01T10:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(timeline.milestones.length);
    expect(ics).toContain("DTSTAMP:20261101T100000Z");
    expect(ics).toContain("SUMMARY:Aarav\\, 8: ");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261201");
  });
});

describe("buildPlan and samples", () => {
  it("uses curated ideas when AI is unavailable", () => {
    const plan = buildPlan(makeBrief(), TODAY);
    expect(plan.ideasSource).toBe("curated");
    expect(aiIdeasSchema.safeParse(plan.ideas).success).toBe(true);
    expect(plan.budget.lines.length).toBeGreaterThan(5);
  });

  it("marks AI ideas and merges their extra tasks into the timeline", () => {
    const ai = {
      ...curatedIdeas(makeBrief()),
      extraTasks: [{ title: "Book a dhol player", daysBefore: 30 }],
    };
    const plan = buildPlan(makeBrief(), TODAY, ai);
    expect(plan.ideasSource).toBe("gemini");
    expect(
      plan.timeline.milestones.some((milestone) => milestone.title === "Book a dhol player"),
    ).toBe(true);
  });

  it("describes the brief in curated summaries, with or without a city and theme", () => {
    expect(curatedIdeas(makeBrief({ city: "", theme: "" })).summary).toContain(
      "a warm, personal celebration",
    );
    expect(curatedIdeas(makeBrief()).summary).toContain("in Hyderabad");
  });

  it("ships samples that validate and fall in the future", () => {
    for (const sample of sampleBriefs(TODAY)) {
      const brief = eventBriefSchema.parse(sample.brief);
      expect(validateEventDate(brief.date, TODAY)).toBeNull();
    }
  });
});

describe("plan extras", () => {
  it("always has a palette, run sheet and invitation", () => {
    const plan = buildPlan(makeBrief({ city: "" }), TODAY);
    expect(plan.ideas.palette.length).toBeGreaterThanOrEqual(3);
    expect(plan.ideas.runSheet.length).toBeGreaterThanOrEqual(3);
    expect(plan.ideas.inviteMessage).toContain("Test Wedding");
    expect(plan.ideas.inviteMessage).not.toContain(" in ,");
  });

  it("keeps AI extras when present and fills missing ones", () => {
    const { palette: _p, runSheet: _r, inviteMessage: _i, ...core } = curatedIdeas(makeBrief());
    const ai = {
      ...core,
      palette: [
        { name: "A", hex: "#000000" },
        { name: "B", hex: "#111111" },
        { name: "C", hex: "#222222" },
      ],
    };
    const plan = buildPlan(makeBrief(), TODAY, ai);
    expect(plan.ideas.palette[0]?.name).toBe("A");
    expect(plan.ideas.runSheet.length).toBeGreaterThan(0);
  });
});

describe("review fixes", () => {
  it("uses the readable event label in curated summaries", () => {
    expect(curatedIdeas(makeBrief({ eventType: "community", city: "Pune" })).summary).toContain(
      "community event in Pune",
    );
  });

  it("adds an accessibility task to the venue when notes mention access needs", () => {
    const venue = buildChecklist("wedding", 100, "Grandparents need step-free access").find(
      (group) => group.id === "venue",
    );
    expect(venue?.tasks.at(-1)?.text).toMatch(/step-free/);
  });

  it("gives each plan its own calendar UIDs", () => {
    const timeline = buildTimeline("birthday", "2026-12-01", 10, TODAY);
    const a = /UID:(\S+)/.exec(buildIcs("Plan A", timeline.milestones))?.[1];
    const b = /UID:(\S+)/.exec(buildIcs("Plan B", timeline.milestones))?.[1];
    expect(a).not.toBe(b);
  });
});
