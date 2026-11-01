# Contributing to Utsav

Thanks for helping. This guide keeps changes small, safe and easy to review.

## Setup

```bash
npm ci
cp .env.example .env.local   # optional: GEMINI_API_KEY for live ideas
npm run dev
```

The app works fully without a key (offline mode), so most work needs no credentials.

## Before you open a pull request

```bash
npm run verify   # format check, lint, typecheck, tests with coverage, build, e2e
```

CI runs the same steps, plus a dependency audit and CodeQL.

## Conventions

- **Where code goes.** Pure planning logic lives in `src/lib/planner` and has no I/O. Anything that talks to Gemini lives in `src/lib/ai`. React state lives in hooks under `src/hooks`; components stay presentational.
- **The AI never does arithmetic.** Budgets, dates and checklists are computed by tested functions. Model output is creative text only and is always validated with Zod.
- **Untrusted data is parsed, not cast.** API responses and local storage go through Zod schemas (`src/lib/planner/restore.ts`). Type assertions are reserved for literal types.
- **Limits are constants.** Lengths, counts and ranges come from `LIMITS`, `IDEA_LIMITS` and `WHAT_IF_RANGE` in `constants.ts`, shared by the client, server and schema.
- **Accessibility is a requirement.** Every new component gets a test with an axe check, real labels, and keyboard support. ESLint runs the strict `jsx-a11y` rule set.
- **Tests.** Add or update tests with every change. Coverage thresholds are enforced (90% lines, functions and statements, 85% branches).
- **Style.** Prettier formats, ESLint enforces complexity, file length and nesting limits. Public functions have JSDoc.

## Reporting security issues

Please follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
