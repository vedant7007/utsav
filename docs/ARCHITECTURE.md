# Architecture

Utsav turns a short event brief into a complete, correct plan, then lets Gemini make it personal.

## Layers

```
src/
  app/              Next.js routes: page, layout (CSP nonce), /api/plan, /api/assistant, /api/health
  proxy.ts          per-request nonce Content-Security-Policy
  components/       presentational React components
    planner/        brief form split into pickers, error summary and the app shell
    plan/           plan workspace: header, overview, budget (what-if, spend table), timeline,
                    vendors, ideas, assistant
    ui/             accessible primitives: tabs, form field
  hooks/            client state: usePlanner, useWhatIf, useAssistantChat, usePersistentState
  lib/
    planner/        pure domain logic: budget, timeline, checklist, ideas, ICS, schemas,
                    form state, restore (no I/O, fully unit tested)
    ai/             Gemini client with model fallback, prompts, LRU cache, ideas and assistant
    http/           request pipeline (origin, content type, size, rate limit) and handlers
    security/       CSP and headers, sliding-window rate limiter, prompt-injection defense
    client/         typed fetch wrappers that validate every response
    errors.ts       safe helpers for unknown thrown values
    logger.ts       structured JSON logs for server events
```

Dependencies point inwards: components use hooks, hooks use `lib/client` and `lib/planner`, and `lib/planner` depends on nothing but Zod. Server-only modules (`lib/ai`, `lib/http`) import `server-only`, so they can never be bundled for the browser.

## Request flow: creating a plan

1. `PlannerForm` validates the brief with `validateForm`, which uses the same `eventBriefSchema` as the server.
2. `usePlanner.submit` calls `requestPlan`, which POSTs to `/api/plan`.
3. The pipeline in `lib/http/api.ts` checks origin, content type, body size and rate limit, then parses JSON.
4. `createPlanHandler` validates the brief again, builds every number and date with `buildPlan`, and asks Gemini for ideas through `generateIdeas` (cached, with fallback models and curated defaults).
5. The client rebuilds the plan with `restorePlan`, so even the server's response is re-validated, and stores it in local storage.

If the server or network fails, `requestPlan` runs the same deterministic planner in the browser.

## Key decisions

- [ADR 0001: The AI never does arithmetic](adr/0001-deterministic-core.md)
- [ADR 0002: Parse untrusted data, never cast it](adr/0002-parse-dont-cast.md)
- [ADR 0003: No database](adr/0003-no-database.md)
