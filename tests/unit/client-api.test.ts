import { ApiError, askAssistant, requestPlan } from "@/lib/client/api";
import { buildPlan } from "@/lib/planner/plan";
import { localTodayIso } from "@/lib/planner/format";
import { addDays } from "@/lib/planner/timeline";
import { makeBrief } from "../fixtures";

const brief = makeBrief({ date: addDays(localTodayIso(), 60) });

function respond(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe("client api", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns a rebuilt plan from a valid response", async () => {
    const plan = buildPlan(brief, localTodayIso());
    vi.stubGlobal("fetch", respond(200, { plan, ai: "ok" }));
    const result = await requestPlan(brief);
    expect(result.ai).toBe("ok");
    expect(result.plan.brief.title).toBe(brief.title);
  });

  it("surfaces validation errors with field messages", async () => {
    vi.stubGlobal(
      "fetch",
      respond(422, { error: { message: "Check the details", fields: { title: "Too long" } } }),
    );
    const failure = await requestPlan(brief).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({ status: 422, fields: { title: "Too long" } });
  });

  it("builds the plan in the browser when the server or network fails", async () => {
    vi.stubGlobal("fetch", respond(503, "down"));
    expect((await requestPlan(brief)).ai).toBe("local");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect((await requestPlan(brief)).ai).toBe("local");
  });

  it("treats a malformed success body as a server failure", async () => {
    vi.stubGlobal("fetch", respond(200, { plan: { brief: {} } }));
    expect((await requestPlan(brief)).ai).toBe("local");
  });

  it("does not mask cancellation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("stop", "AbortError")));
    await expect(requestPlan(brief)).rejects.toMatchObject({ name: "AbortError" });
  });

  it("validates assistant replies", async () => {
    vi.stubGlobal("fetch", respond(200, { reply: "Start with the venue.", source: "offline" }));
    await expect(askAssistant(brief, [], "first?")).resolves.toEqual({
      reply: "Start with the venue.",
      source: "offline",
    });
    vi.stubGlobal("fetch", respond(200, { reply: 5 }));
    await expect(askAssistant(brief, [], "first?")).rejects.toBeInstanceOf(ApiError);
    vi.stubGlobal("fetch", respond(429, null));
    await expect(askAssistant(brief, [], "first?")).rejects.toMatchObject({
      status: 429,
      message: "Something went wrong.",
    });
  });
});
