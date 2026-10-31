import type { EventBrief } from "@/lib/planner/schema";

export const TODAY = "2026-11-01";

export function makeBrief(overrides: Partial<EventBrief> = {}): EventBrief {
  return {
    eventType: "wedding",
    title: "Test Wedding",
    date: "2027-03-01",
    city: "Hyderabad",
    guests: 200,
    budget: 1_000_000,
    currency: "INR",
    theme: "Marigold garden",
    priorities: [],
    notes: "",
    ...overrides,
  };
}
