import { petalLength, petalPath } from "@/components/brand/rangoli";
import { readableTextOn, relativeLuminance } from "@/lib/planner/color";
import { slugify } from "@/lib/planner/format";
import { foldIcsLine } from "@/lib/planner/ics";
import { scheduleLeads } from "@/lib/planner/timeline";

describe("scheduleLeads", () => {
  it("keeps ideal lead times when there is enough runway", () => {
    expect(scheduleLeads([{ daysBefore: 30 }, { daysBefore: 7 }, { daysBefore: 0 }], 60)).toEqual([
      { days: 30, rushed: false },
      { days: 7, rushed: false },
      { days: 0, rushed: false },
    ]);
  });

  it("spreads overdue tasks across the catch-up window in their original order", () => {
    const leads = scheduleLeads(
      [{ daysBefore: 180 }, { daysBefore: 120 }, { daysBefore: 90 }, { daysBefore: 2 }],
      20,
    );
    expect(leads.map((lead) => lead.rushed)).toEqual([true, true, true, false]);
    const rushedDays = leads.slice(0, 3).map((lead) => lead.days);
    expect(rushedDays[0]).toBe(20);
    expect(rushedDays).toEqual([...rushedDays].sort((a, b) => b - a));
    expect(Math.min(...rushedDays)).toBeGreaterThanOrEqual(0);
  });

  it("schedules everything for today when the event is today", () => {
    const leads = scheduleLeads([{ daysBefore: 14 }, { daysBefore: 0 }], 0);
    expect(leads).toEqual([
      { days: 0, rushed: true },
      { days: 0, rushed: false },
    ]);
  });
});

describe("rangoli geometry", () => {
  it("gives the largest share the longest petal and keeps small shares visible", () => {
    expect(petalLength(0.5, 0.5)).toBe(80);
    expect(petalLength(0.01, 0.5)).toBeGreaterThan(34);
    expect(petalLength(0.01, 0.5)).toBeLessThan(petalLength(0.2, 0.5));
  });

  it("draws a closed path from the base to the tip", () => {
    const path = petalPath(50, 10);
    expect(path.startsWith("M 100 84")).toBe(true);
    expect(path).toContain(", 100 34");
    expect(path.endsWith("Z")).toBe(true);
  });
});

describe("colour contrast", () => {
  it("computes WCAG luminance at the extremes", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1);
  });

  it("chooses white text on dark swatches and ink on light ones", () => {
    expect(readableTextOn("#1A1033")).toBe("#ffffff");
    expect(readableTextOn("#FFF5D6")).toBe("#1a1033");
  });
});

describe("slugify", () => {
  it("makes safe file names and falls back when nothing is left", () => {
    expect(slugify("Ananya & Rohan's Wedding!")).toBe("ananya-rohan-s-wedding");
    expect(slugify("  ---  ")).toBe("utsav");
    expect(slugify("💍", "plan")).toBe("plan");
  });
});

describe("foldIcsLine", () => {
  it("never splits a multi-byte character and keeps every line within 75 octets", () => {
    const folded = foldIcsLine(`SUMMARY:${"मेहंदी ".repeat(20)}`);
    const encoder = new TextEncoder();
    for (const line of folded.split("\r\n")) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"मेहंदी ".repeat(20)}`);
  });
});
