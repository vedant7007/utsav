# Security

## Reporting

Please report vulnerabilities privately to vedantidlgave16@gmail.com rather than opening a public issue.

## Threat model and controls

| Threat | Control | Where |
| --- | --- | --- |
| Malformed or hostile input | Zod schemas on client and server, control-character stripping, length caps, real-date and range checks | `src/lib/planner/schema.ts`, `src/lib/planner/plan.ts` |
| Prompt injection through the brief or chat | Untrusted text fenced in `<host_input>` blocks; fence tags stripped; instruction hierarchy in system prompts; suspicious phrases logged; model output validated against a schema; numbers never come from the model | `src/lib/security/prompt-defense.ts`, `src/lib/ai/prompts.ts`, `src/lib/ai/planner-ai.ts` |
| Quota abuse and cost blow-up | Per-client sliding-window rate limits, same-origin check, 16 KB body cap, output-token caps, timeouts, response cache | `src/lib/http/api.ts`, `src/lib/security/rate-limit.ts`, `src/lib/ai/gemini.ts` |
| Cross-site scripting | React escaping, no `dangerouslySetInnerHTML`, nonce-based CSP with `strict-dynamic`, `object-src 'none'`, `base-uri 'self'` | `src/proxy.ts`, `src/lib/security/headers.ts` |
| Clickjacking and sniffing | `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` | `next.config.ts` |
| Secret leakage | API key read only in server modules (`server-only`), never returned to clients, `.env*` gitignored, health endpoint reports only on/off | `src/lib/ai/gemini.ts`, `.gitignore` |
| Tampered local storage | Stored plans are re-validated with the same schema before use; corrupt data is ignored | `src/components/planner/planner-app.tsx` |
| Vulnerable dependencies | Pinned versions, `npm audit` in CI | `.github/workflows/ci.yml` |

## Known limits

- Rate limits are per server instance. A shared store such as Redis would make them global across serverless instances.
- Plans live in the browser's local storage. Nothing personal is stored on the server.
