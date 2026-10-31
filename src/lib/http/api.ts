import { NextResponse } from "next/server";
import type { z } from "zod";
import { fieldErrors } from "@/lib/planner/schema";
import type { SlidingWindowRateLimiter } from "@/lib/security/rate-limit";
import { clientKey } from "@/lib/security/rate-limit";

/** Largest accepted JSON body. A full brief with history is well under 8 KB. */
export const MAX_BODY_BYTES = 16 * 1024;

const NO_STORE = { "Cache-Control": "no-store" };

/** Consistent JSON error shape for every API route. */
export function errorResponse(
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...extra } },
    { status, headers: { ...NO_STORE, ...headers } },
  );
}

export function okResponse(body: unknown): NextResponse {
  return NextResponse.json(body, { headers: NO_STORE });
}

/**
 * Rejects cross-site browser requests. Same-origin fetches and non-browser clients (no Origin
 * header) are allowed; a browser on another site cannot spend this app's AI quota.
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/**
 * Runs the shared request checks in order: origin, rate limit, content type, size, JSON
 * syntax and schema validation.
 */
export async function parseJsonRequest<S extends z.ZodType>(
  request: Request,
  schema: S,
  limiter: SlidingWindowRateLimiter,
): Promise<Parsed<z.output<S>>> {
  if (!isAllowedOrigin(request)) {
    return {
      ok: false,
      response: errorResponse(403, "forbidden_origin", "Cross-site requests are not allowed."),
    };
  }
  const decision = limiter.check(clientKey(request.headers));
  if (!decision.allowed) {
    return {
      ok: false,
      response: errorResponse(
        429,
        "rate_limited",
        `Too many requests. Try again in ${decision.retryAfterSeconds} seconds.`,
        {},
        { "Retry-After": String(decision.retryAfterSeconds) },
      ),
    };
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return { ok: false, response: errorResponse(415, "unsupported_media_type", "Send JSON.") };
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: errorResponse(413, "payload_too_large", "Request body is too large."),
    };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: errorResponse(413, "payload_too_large", "Request body is too large."),
    };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, response: errorResponse(400, "invalid_json", "Body is not valid JSON.") };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      ok: false,
      response: errorResponse(422, "validation_failed", "Some details need fixing.", {
        fields: fieldErrors(result.error),
      }),
    };
  }
  return { ok: true, data: result.data };
}
