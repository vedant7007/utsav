# ADR 0001: The AI never does arithmetic

## Status

Accepted

## Context

Language models make arithmetic and date mistakes, and they are sometimes unavailable or slow. A wedding budget that does not add up, or a timeline with the wrong dates, is worse than no plan.

## Decision

Budgets, timelines and vendor checklists are produced by pure functions in `src/lib/planner`. Gemini contributes only creative content (theme, decor, food, activities, saving tips, palette, run sheet, invitation, a few extra tasks) and chat answers. Model output is parsed with Zod and each optional field is validated on its own, so one bad field falls back to curated content without discarding the rest.

## Consequences

- Plans are always correct and the app works with no API key.
- Core logic is fast to test exhaustively (exact sums, leap years, compression windows).
- Creative quality depends on Gemini, but a curated fallback always exists.
