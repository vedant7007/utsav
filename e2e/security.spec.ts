import { expect, test } from "@playwright/test";

test("pages send a nonce CSP and hardening headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toMatch(
    /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/,
  );
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("the plan API rejects cross-site and malformed requests", async ({ request }) => {
  const crossSite = await request.post("/api/plan", {
    headers: { origin: "https://evil.example", "content-type": "application/json" },
    data: {},
  });
  expect(crossSite.status()).toBe(403);

  const invalid = await request.post("/api/plan", { data: { eventType: "party" } });
  expect(invalid.status()).toBe(422);
  expect((await invalid.json()).error.fields).toBeDefined();
});

test("health reports status without exposing configuration", async ({ request }) => {
  const body = await (await request.get("/api/health")).json();
  expect(body).toEqual({ status: "ok", ai: "offline" });
});
