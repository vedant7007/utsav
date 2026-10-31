import {
  type Currency,
  type EventType,
  MIN_PER_GUEST,
  PRIORITY_BOOST,
  type Priority,
} from "./constants";

/** A budget line in the plan. `share` is a fraction of the total (0..1). */
export interface BudgetLine {
  id: string;
  label: string;
  share: number;
  amount: number;
  priority: boolean;
}

export interface BudgetPlan {
  total: number;
  currency: Currency;
  perGuest: number;
  lines: BudgetLine[];
  tight: boolean;
}

interface CategoryTemplate {
  id: string;
  label: string;
  /** Percentage points. Each template sums to exactly 100. */
  weight: number;
  /** Which user priority, if any, boosts this category. */
  boostedBy?: Priority;
  /** Contingency is never reduced to fund priorities. */
  protected?: boolean;
}

const CONTINGENCY: CategoryTemplate = {
  id: "contingency",
  label: "Contingency buffer",
  weight: 5,
  protected: true,
};

/** Category splits per event type, based on common Indian and global planning guides. */
export const BUDGET_TEMPLATES: Record<EventType, CategoryTemplate[]> = {
  wedding: [
    { id: "venue", label: "Venue and stay", weight: 24, boostedBy: "venue" },
    { id: "catering", label: "Catering", weight: 28, boostedBy: "food" },
    { id: "decor", label: "Decor and flowers", weight: 11, boostedBy: "decor" },
    { id: "photo", label: "Photography and video", weight: 10, boostedBy: "photography" },
    { id: "attire", label: "Attire, makeup and jewellery", weight: 9, boostedBy: "attire" },
    { id: "music", label: "Music, DJ and sangeet", weight: 6, boostedBy: "entertainment" },
    { id: "invites", label: "Invitations and stationery", weight: 2 },
    { id: "transport", label: "Transport and logistics", weight: 3 },
    { id: "favours", label: "Gifts and return favours", weight: 2 },
    CONTINGENCY,
  ],
  birthday: [
    { id: "venue", label: "Venue", weight: 20, boostedBy: "venue" },
    { id: "food", label: "Food, cake and drinks", weight: 33, boostedBy: "food" },
    { id: "decor", label: "Decor and balloons", weight: 14, boostedBy: "decor" },
    { id: "fun", label: "Entertainment and games", weight: 14, boostedBy: "entertainment" },
    { id: "photo", label: "Photography", weight: 5, boostedBy: "photography" },
    { id: "outfit", label: "Outfit and styling", weight: 3, boostedBy: "attire" },
    { id: "invites", label: "Invitations", weight: 2 },
    { id: "favours", label: "Return gifts", weight: 4 },
    CONTINGENCY,
  ],
  anniversary: [
    { id: "venue", label: "Venue", weight: 25, boostedBy: "venue" },
    { id: "catering", label: "Dinner and catering", weight: 30, boostedBy: "food" },
    { id: "decor", label: "Decor and flowers", weight: 12, boostedBy: "decor" },
    { id: "photo", label: "Photography", weight: 9, boostedBy: "photography" },
    { id: "music", label: "Live music or DJ", weight: 9, boostedBy: "entertainment" },
    { id: "attire", label: "Outfits and styling", weight: 4, boostedBy: "attire" },
    { id: "gifts", label: "Gifts and keepsakes", weight: 4 },
    { id: "invites", label: "Invitations", weight: 2 },
    CONTINGENCY,
  ],
  community: [
    { id: "venue", label: "Venue, permits and licences", weight: 20, boostedBy: "venue" },
    { id: "food", label: "Food and refreshments", weight: 24, boostedBy: "food" },
    { id: "av", label: "Stage, sound and lighting", weight: 15, boostedBy: "entertainment" },
    { id: "promo", label: "Promotion and signage", weight: 9 },
    { id: "safety", label: "Safety, first aid and cleanup", weight: 10 },
    { id: "decor", label: "Decor", weight: 6, boostedBy: "decor" },
    { id: "supplies", label: "Volunteer kits and supplies", weight: 7 },
    { id: "photo", label: "Photography", weight: 4, boostedBy: "photography" },
    CONTINGENCY,
  ],
};

/**
 * Rounds fractional amounts to whole units while keeping their exact sum (largest remainder
 * method), so the budget table always adds up to the total the user typed.
 * @param values - raw, non-negative amounts.
 * @param total - the whole-number sum the result must hit.
 */
export function roundPreservingSum(values: number[], total: number): number[] {
  const floors = values.map((value) => Math.floor(value));
  let remainder = total - floors.reduce((sum, value) => sum + value, 0);
  const order = values
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of order) {
    if (remainder <= 0) break;
    floors[index] = (floors[index] ?? 0) + 1;
    remainder -= 1;
  }
  return floors;
}

/**
 * Computes category shares after applying priorities. Priority categories gain
 * PRIORITY_BOOST of the non-priority pool in proportion to their template weight;
 * protected categories (the contingency buffer) are never reduced.
 * @param template - category template for the event type.
 * @param priorities - the user's chosen priorities.
 * @returns shares in the same order as the template, summing to 1.
 */
export function computeShares(template: CategoryTemplate[], priorities: Priority[]): number[] {
  const base = template.map((category) => category.weight / 100);
  const isPriority = template.map(
    (category) => category.boostedBy !== undefined && priorities.includes(category.boostedBy),
  );
  if (!isPriority.some(Boolean)) return base;

  const donorIndexes = template
    .map((category, index) => ({ category, index }))
    .filter(({ category, index }) => !isPriority[index] && !category.protected)
    .map(({ index }) => index);
  const donorTotal = donorIndexes.reduce((sum, index) => sum + (base[index] ?? 0), 0);
  const moved = donorTotal * PRIORITY_BOOST;
  const priorityTotal = base.reduce(
    (sum, value, index) => sum + (isPriority[index] ? value : 0),
    0,
  );

  return base.map((value, index) => {
    if (isPriority[index]) return value + moved * (value / priorityTotal);
    if (donorIndexes.includes(index)) return value * (1 - PRIORITY_BOOST);
    return value;
  });
}

/**
 * Builds the budget breakdown for an event.
 * @param eventType - which template to use.
 * @param total - total budget in whole currency units.
 * @param guests - expected guest count, for the per-guest check.
 * @param currency - display currency and threshold table.
 * @param priorities - categories to favour.
 */
export function buildBudget(
  eventType: EventType,
  total: number,
  guests: number,
  currency: Currency,
  priorities: Priority[],
): BudgetPlan {
  const template = BUDGET_TEMPLATES[eventType];
  const wholeTotal = Math.round(total);
  const shares = computeShares(template, priorities);
  const amounts = roundPreservingSum(
    shares.map((share) => share * wholeTotal),
    wholeTotal,
  );
  const lines = template.map((category, index) => ({
    id: category.id,
    label: category.label,
    share: shares[index] ?? 0,
    amount: amounts[index] ?? 0,
    priority: category.boostedBy !== undefined && priorities.includes(category.boostedBy),
  }));
  const perGuest = guests > 0 ? Math.round(wholeTotal / guests) : wholeTotal;
  return {
    total: wholeTotal,
    currency,
    perGuest,
    lines,
    tight: perGuest < MIN_PER_GUEST[eventType][currency],
  };
}

/** One row of the spend tracker: planned versus actual for a budget line. */
export interface SpendRow {
  id: string;
  label: string;
  planned: number;
  actual: number;
  variance: number;
  over: boolean;
}

export interface SpendSummary {
  rows: SpendRow[];
  plannedTotal: number;
  actualTotal: number;
  remaining: number;
  overCount: number;
}

/**
 * Compares actual spend with the plan. Missing or invalid entries count as zero.
 * @param lines - planned budget lines.
 * @param actuals - actual spend keyed by line id.
 */
export function summariseSpend(lines: BudgetLine[], actuals: Record<string, number>): SpendSummary {
  const rows = lines.map((line) => {
    const raw = actuals[line.id];
    const actual = typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? raw : 0;
    return {
      id: line.id,
      label: line.label,
      planned: line.amount,
      actual,
      variance: line.amount - actual,
      over: actual > line.amount,
    };
  });
  const plannedTotal = rows.reduce((sum, row) => sum + row.planned, 0);
  const actualTotal = rows.reduce((sum, row) => sum + row.actual, 0);
  return {
    rows,
    plannedTotal,
    actualTotal,
    remaining: plannedTotal - actualTotal,
    overCount: rows.filter((row) => row.over).length,
  };
}
