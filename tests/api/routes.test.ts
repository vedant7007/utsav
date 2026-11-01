import type { TextModel } from "@/lib/ai/gemini";
import { clearIdeasCache } from "@/lib/ai/ideas";
import { MAX_BODY_BYTES } from "@/lib/http/api";
import { createAssistantHandler, createPlanHandler } from "@/lib/http/handlers";
import { curatedIdeas } from "@/lib/planner/ideas";
import { SlidingWindowRateLimiter } from "@/lib/security/rate-limit";
import { makeBrief, TODAY } from "../fixtures";

vi.mock("server-only", () => ({}));

const URL_BASE = "https://utsav.example/api/plan";

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(URL_BASE, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const okModel: TextModel = {
  id: "fake",
  generate: async () => JSON.stringify({ ...curatedIdeas(makeBrief()), summary: "From Gemini" }),
};

function planHandler(model: TextModel | null = null, limit = 100) {
  return createPlanHandler({
    model: () => model,
    today: () => TODAY,
    limiter: new SlidingWindowRateLimiter(limit, 60_000),
  });
}

beforeEach(() => {
  clearIdeasCache();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("POST /api/plan", () => {
  it("returns a full offline plan without a model", async () => {
    const response = await planHandler()(post(makeBrief()));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.ai).toBe("offline");
    expect(body.plan.ideasSource).toBe("curated");
    expect(body.plan.budget.total).toBe(1_000_000);
  });

  it("uses Gemini ideas when the model answers", async () => {
    const body = await (await planHandler(okModel)(post(makeBrief()))).json();
    expect(body.ai).toBe("ok");
    expect(body.plan.ideas.summary).toBe("From Gemini");
  });

  it("returns field errors for invalid briefs and past dates", async () => {
    const invalid = await planHandler()(post({ ...makeBrief(), guests: 0 }));
    expect(invalid.status).toBe(422);
    expect((await invalid.json()).error.fields.guests).toBeDefined();

    const past = await planHandler()(post(makeBrief({ date: "2026-01-01" })));
    expect(past.status).toBe(422);
    expect((await past.json()).error.fields.date).toMatch(/today or later/);
  });

  it("rejects bad JSON, wrong content type and oversized bodies", async () => {
    expect((await planHandler()(post("{oops"))).status).toBe(400);
    expect((await planHandler()(post(makeBrief(), { "content-type": "text/plain" }))).status).toBe(
      415,
    );
    expect(
      (await planHandler()(post(makeBrief(), { "content-length": String(MAX_BODY_BYTES + 1) })))
        .status,
    ).toBe(413);
    expect(
      (await planHandler()(post(JSON.stringify({ pad: "x".repeat(MAX_BODY_BYTES) })))).status,
    ).toBe(413);
  });

  it("blocks cross-site browser requests but allows same-origin ones", async () => {
    expect(
      (await planHandler()(post(makeBrief(), { origin: "https://evil.example" }))).status,
    ).toBe(403);
    expect(
      (await planHandler()(post(makeBrief(), { origin: "https://utsav.example" }))).status,
    ).toBe(200);
    expect((await planHandler()(post(makeBrief(), { origin: "not a url" }))).status).toBe(403);
  });

  it("rate limits per client with a Retry-After header", async () => {
    const handler = planHandler(null, 1);
    expect((await handler(post(makeBrief(), { "x-real-ip": "9.9.9.9" }))).status).toBe(200);
    const limited = await handler(post(makeBrief(), { "x-real-ip": "9.9.9.9" }));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBeTruthy();
  });
});

describe("POST /api/assistant", () => {
  const handler = (model: TextModel | null) =>
    createAssistantHandler({
      model: () => model,
      limiter: new SlidingWindowRateLimiter(100, 60_000),
    });

  it("answers with the model", async () => {
    const model: TextModel = { id: "fake", generate: async () => "Book the venue first." };
    const response = await handler(model)(
      post({ brief: makeBrief(), message: "What first?", history: [] }),
    );
    expect(await response.json()).toEqual({ reply: "Book the venue first.", source: "gemini" });
  });

  it("answers offline and validates the message", async () => {
    const offline = await handler(null)(post({ brief: makeBrief(), message: "save money?" }));
    expect((await offline.json()).source).toBe("offline");
    const empty = await handler(null)(post({ brief: makeBrief(), message: "   " }));
    expect(empty.status).toBe(422);
    const longHistory = Array.from({ length: 9 }, () => ({ role: "user", content: "hi" }));
    expect(
      (await handler(null)(post({ brief: makeBrief(), message: "hi", history: longHistory })))
        .status,
    ).toBe(422);
  });
});

describe("assistant history round trip", () => {
  it("accepts a full history of maximum-length replies in a non-Latin script", async () => {
    const handler = createAssistantHandler({
      model: () => null,
      limiter: new SlidingWindowRateLimiter(100, 60_000),
    });
    const reply = "शादी".repeat(275); // 1,100 characters, 3 bytes each in UTF-8
    const history = Array.from({ length: 6 }, (_, index) => ({
      role: index % 2 ? "assistant" : "user",
      content: reply,
    }));
    const response = await handler(post({ brief: makeBrief(), message: "Next?", history }));
    expect(response.status).toBe(200);
  });

  it("allows an event dated yesterday in India for hosts in earlier time zones", async () => {
    const response = await planHandler()(post(makeBrief({ date: "2026-10-31" })));
    expect(response.status).toBe(200);
  });
});
