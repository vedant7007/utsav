# ADR 0002: Parse untrusted data, never cast it

## Status

Accepted

## Context

The client reads plans from the API and from local storage. Both can be stale, from an older version, or tampered with.

## Decision

Every untrusted value is parsed with Zod (`restorePlan`, `restoreProgress`, the response schemas in `lib/client/api.ts`). Only the brief and the ideas are read from stored plans; every number and date is recomputed for today. Type assertions on external data are not used, and ESLint forbids object-literal assertions.

## Consequences

- Corrupt storage can never crash the page or show a stale countdown.
- A small cost per load to rebuild the plan, which takes well under a millisecond.
