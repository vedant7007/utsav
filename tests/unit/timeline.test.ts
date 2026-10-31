import { EVENT_TYPES } from "@/lib/planner/constants";
import {
  addDays,
  buildTimeline,
  daysBetween,
  parseIsoDate,
  toIsoDate,
} from "@/lib/planner/timeline";
import { TODAY } from "../fixtures";

describe("date helpers", () => {
  it("adds days across month and leap-year boundaries", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("counts whole days in both directions", () => {
    expect(daysBetween("2026-11-01", "2026-11-11")).toBe(10);
    expect(daysBetween("2026-11-11", "2026-11-01")).toBe(-10);
  });

  it("round-trips ISO dates", () => {
    expect(toIsoDate(parseIsoDate("2027-06-15"))).toBe("2027-06-15");
  });
});

describe("buildTimeline", () => {
  it("schedules every task on its ideal date when there is enough time", () => {
    const plan = buildTimeline("birthday", addDays(TODAY, 60), 20, TODAY);
    expect(plan.compressed).toBe(false);
    expect(plan.daysUntil).toBe(60);
    const cake = plan.milestones.find((milestone) => milestone.id === "cake");
    expect(cake?.date).toBe(addDays(TODAY, 50));
    expect(plan.milestones.every((milestone) => !milestone.rushed)).toBe(true);
  });

  it.each(EVENT_TYPES)("%s timeline is chronological and ends with the thank-you task", (type) => {
    const plan = buildTimeline(type, addDays(TODAY, 15), 400, TODAY);
    const dates = plan.milestones.map((milestone) => milestone.date);
    expect([...dates].sort()).toEqual(dates);
    expect(plan.milestones.at(-1)?.id).toBe("thank-you");
    expect(plan.milestones.find((milestone) => milestone.id === "day-of")?.date).toBe(
      addDays(TODAY, 15),
    );
  });

  it("pulls overdue tasks forward, never before today, and marks them rushed", () => {
    const plan = buildTimeline("wedding", addDays(TODAY, 30), 100, TODAY);
    expect(plan.compressed).toBe(true);
    const rushed = plan.milestones.filter((milestone) => milestone.rushed);
    expect(rushed.length).toBeGreaterThan(5);
    for (const milestone of rushed) {
      expect(milestone.date >= TODAY).toBe(true);
      expect(milestone.date <= addDays(TODAY, 30)).toBe(true);
    }
    // Spread over several days rather than all on day one.
    expect(new Set(rushed.map((milestone) => milestone.date)).size).toBeGreaterThan(3);
  });

  it("handles an event happening today", () => {
    const plan = buildTimeline("birthday", TODAY, 10, TODAY);
    expect(plan.daysUntil).toBe(0);
    expect(
      plan.milestones
        .filter((milestone) => milestone.daysBefore >= 0)
        .every((m) => m.date === TODAY),
    ).toBe(true);
  });

  it("adds large-event logistics only above the guest threshold", () => {
    const small = buildTimeline("wedding", addDays(TODAY, 300), 100, TODAY);
    const large = buildTimeline("wedding", addDays(TODAY, 300), 300, TODAY);
    expect(small.milestones.some((milestone) => milestone.id === "parking")).toBe(false);
    expect(large.milestones.some((milestone) => milestone.id === "parking")).toBe(true);
  });

  it("merges extra AI tasks and labels their source", () => {
    const plan = buildTimeline("anniversary", addDays(TODAY, 90), 40, TODAY, [
      { title: "Book a string quartet", daysBefore: 20 },
    ]);
    const extra = plan.milestones.find((milestone) => milestone.source === "ai");
    expect(extra).toMatchObject({
      id: "ai-1",
      title: "Book a string quartet",
      date: addDays(TODAY, 70),
    });
  });

  it("assigns phases from the scheduled lead time", () => {
    const plan = buildTimeline("community", addDays(TODAY, 120), 50, TODAY);
    const phase = (id: string) => plan.milestones.find((milestone) => milestone.id === id)?.phase;
    expect(phase("goals")).toBe("early");
    expect(phase("food")).toBe("build-up");
    expect(phase("briefing")).toBe("final-week");
    expect(phase("day-of")).toBe("event-day");
    expect(phase("thank-you")).toBe("after");
  });
});
