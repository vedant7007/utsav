import { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";

describe("proxy", () => {
  it("sets a fresh nonce CSP on the response and forwards the nonce to the page", () => {
    const first = proxy(new NextRequest("https://utsav.test/"));
    const second = proxy(new NextRequest("https://utsav.test/"));
    const policy = first.headers.get("Content-Security-Policy") ?? "";
    expect(policy).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).not.toBe(second.headers.get("Content-Security-Policy"));
    expect(first.headers.get("x-middleware-request-x-nonce")).toBeTruthy();
  });

  it("skips API routes, static assets and prefetches", () => {
    const [rule] = config.matcher;
    expect(rule?.source).toContain("?!api|_next/static");
    expect(rule?.missing.map((header) => header.key)).toContain("next-router-prefetch");
  });
});
