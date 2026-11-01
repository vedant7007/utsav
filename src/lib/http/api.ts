import { NextResponse } from "next/server";
import type { z } from "zod";
import { fieldErrors } from "@/lib/planner/schema";
import type { SlidingWindowRateLimiter } from "@/lib/security/rate-limit";
import { clientKey } from "@/lib/security/rate-limit";

/**
 * Largest accepted JSON body. A brief plus six 1,100-character history turns in a non-Latin
 * script (up to 3 bytes per character) stays under this.
 */
export const MAX_BODY_BYTES = 32 * 1024;

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

/** JSON success response that is never cached. */
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

/** HTTP status codes used by the API, named for readability. */
export const HTTP_STATUS = {
  badRequest: 400,
  forbidden: 403,
  payloadTooLarge: 413,
  unsupportedMediaType: 415,
  unprocessable: 422,
  tooManyRequests: 429,
} as const;

type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

const fail = (response: NextResponse): { ok: false; response: NextResponse } => ({
  ok: false,
  response,
});

const tooLarge = (): NextResponse =>
  errorResponse(HTTP_STATUS.payloadTooLarge, "payload_too_large", "Request body is too large.");

/**
 * Cheap checks that need only the headers: origin, rate limit, content type and declared size.
 * @returns an error response, or null when the request may proceed.
 */
function checkHeaders(request: Request, limiter: SlidingWindowRateLimiter): NextResponse | null {
  if (!isAllowedOrigin(request)) {
    return errorResponse(
      HTTP_STATUS.forbidden,
      "forbidden_origin",
      "Cross-site requests are not allowed.",
    );
  }
  const decision = limiter.check(clientKey(request.headers));
  if (!decision.allowed) {
    const seconds = decision.retryAfterSeconds;
    return errorResponse(
      HTTP_STATUS.tooManyRequests,
      "rate_limited",
      `Too many requests. Try again in ${seconds} seconds.`,
      {},
      { "Retry-After": String(seconds) },
    );
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse(HTTP_STATUS.unsupportedMediaType, "unsupported_media_type", "Send JSON.");
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  return declared > MAX_BODY_BYTES ? tooLarge() : null;
}

/** Reads the body, enforcing the real byte size (the header can lie), and parses JSON. */
async function readJson(request: Request): Promise<Parsed<unknown>> {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return fail(tooLarge());
  try {
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return fail(errorResponse(HTTP_STATUS.badRequest, "invalid_json", "Body is not valid JSON."));
  }
}

/**
 * Runs the shared request checks in order: origin, rate limit, content type, size, JSON
 * syntax and schema validation.
 * @param request - incoming request.
 * @param schema - Zod schema for the body.
 * @param limiter - per-client rate limiter for this route.
 */
export async function parseJsonRequest<S extends z.ZodType>(
  request: Request,
  schema: S,
  limiter: SlidingWindowRateLimiter,
): Promise<Parsed<z.output<S>>> {
  const rejected = checkHeaders(request, limiter);
  if (rejected) return fail(rejected);
  const body = await readJson(request);
  if (!body.ok) return body;
  const result = schema.safeParse(body.data);
  if (!result.success) {
    return fail(
      errorResponse(HTTP_STATUS.unprocessable, "validation_failed", "Some details need fixing.", {
        fields: fieldErrors(result.error),
      }),
    );
  }
  return { ok: true, data: result.data };
}
