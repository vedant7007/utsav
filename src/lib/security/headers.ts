/** A single HTTP response header, in the shape next.config `headers()` expects. */
export interface HeaderEntry {
  key: string;
  value: string;
}

/**
 * Builds a strict, nonce-based Content-Security-Policy for one request. Scripts run only with
 * the per-request nonce (`'strict-dynamic'` lets those scripts load Next.js chunks); there is
 * no `'unsafe-inline'` or `'unsafe-eval'` for scripts in production. Style elements also need
 * the nonce. The single exception is `style-src-attr 'unsafe-inline'`: style attributes cannot
 * execute code, and Next.js's route announcer relies on one.
 * @param nonce - a fresh, unpredictable value for this request.
 * @param isDevelopment - development additionally allows eval for React's debugging tools.
 */
export function buildContentSecurityPolicy(nonce: string, isDevelopment: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", `'nonce-${nonce}'`],
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDevelopment) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

/**
 * Creates a random nonce for one request.
 * @returns 128 bits of randomness, base64 encoded.
 */
export function createNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64");
}

/**
 * Static hardening headers applied to every route by next.config. The CSP is set per request
 * by the proxy, because it carries a nonce.
 */
export function securityHeaders(): HeaderEntry[] {
  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  ];
}
