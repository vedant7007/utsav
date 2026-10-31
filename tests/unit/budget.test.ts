import { BUDGET_TEMPLATES, buildBudget, computeShares, roundPreservingSum, summariseSpend } from "@/lib/planner/budget";
import { EVENT_TYPES } from "@/lib/planner/constants";

describe("budget templates", () => {
  it.each(EVENT_TYPES)("%s template weights sum to exactly 100", (type) => {
    const total = BUDGET_TEMPLATES[type].reduce((sum, category) => sum + category.weight, 0);
    expect(total).toBe(100);
  });

  it.each(EVENT_TYPES)("%s template has a contingency buffer and unique ids", (type) => {
    const ids = BUDGET_TEMPLATES[type].map((category) => category.id);
    expect(ids).toContain("contingency");
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("roundPreservingSum", () => {
  it("keeps the exact total after rounding", () => {
    expect(roundPreservingSum([33.33, 33.33, 33.34], 100)).toEqual([33, 33, 34]);
  });

  it("gives leftover units to the largest fractions first", () => {
    expect(roundPreservingSum([1.9, 1.1, 1.0], 4)).toEqual([2, 1, 1]);
  });

  it("breaks ties by original order", () => {
    expect(roundPreservingSum([0.5, 0.5], 1)).toEqual([1, 0]);
  });
});

describe("computeShares", () => {
  const template = BUDGET_TEMPLATES.birthday;

  it("returns template weights when there are no priorities", () => {
    expect(computeShares(template, [])).toEqual(template.map((category) => category.weight / 100));
  });

  it("boosts priorities, keeps contingency fixed and still sums to 1", () => {
    const base = computeShares(template, []);
    const boosted = computeShares(template, ["food"]);
    const foodIndex = template.findIndex((category) => category.id === "food");
    const contingencyIndex = template.findIndex((category) => category.id === "contingency");
    expect(boosted[foodIndex]).toBeGreaterThan(base[foodIndex] ?? 0);
    expect(boosted[contingencyIndex]).toBeCloseTo(base[contingencyIndex] ?? 0);
    expect(boosted.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10);
  });

  it("ignores priorities that do not map to any category", () => {
    const community = BUDGET_TEMPLATES.community;
    expect(computeShares(community, ["attire"])).toEqual(community.map((category) => category.weight / 100));
  });
});

describe("buildBudget", () => {
  it("allocates the whole budget across lines with no rounding drift", () => {
    const plan = buildBudget("wedding", 1_234_567, 250, "INR", ["food", "photography"]);
    expect(plan.lines.reduce((sum, line) => sum + line.amount, 0)).toBe(1_234_567);
    expect(plan.lines.filter((line) => line.priority).map((line) => line.id)).toEqual(["catering", "photo"]);
  });

  it("rounds fractional totals to whole currency units", () => {
    expect(buildBudget("birthday", 10_000.6, 10, "INR", []).total).toBe(10_001);
  });

  it("computes per-guest spend and flags tight budgets", () => {
    expect(buildBudget("wedding", 100_000, 200, "INR", []).tight).toBe(true);
    const comfortable = buildBudget("wedding", 2_000_000, 200, "INR", []);
    expect(comfortable.perGuest).toBe(10_000);
    expect(comfortable.tight).toBe(false);
  });

  it("uses currency-specific thresholds", () => {
    expect(buildBudget("birthday", 500, 20, "USD", []).tight).toBe(false);
    expect(buildBudget("birthday", 300, 20, "USD", []).tight).toBe(true);
  });
});

describe("summariseSpend", () => {
  const lines = buildBudget("birthday", 10_000, 10, "INR", []).lines;

  it("treats missing, negative and non-numeric entries as zero", () => {
    const summary = summariseSpend(lines, { venue: -5, food: Number.NaN });
    expect(summary.actualTotal).toBe(0);
    expect(summary.remaining).toBe(10_000);
  });

  it("flags over-budget lines and totals spend", () => {
    const venue = lines.find((line) => line.id === "venue");
    const summary = summariseSpend(lines, { venue: (venue?.amount ?? 0) + 1, food: 100 });
    expect(summary.overCount).toBe(1);
    expect(summary.rows.find((row) => row.id === "venue")?.over).toBe(true);
    expect(summary.actualTotal).toBe((venue?.amount ?? 0) + 101);
  });
});
