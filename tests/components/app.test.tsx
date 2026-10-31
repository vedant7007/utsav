// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantChat } from "@/components/plan/assistant-chat";
import { PlannerApp } from "@/components/planner/planner-app";
import { buildPlan } from "@/lib/planner/plan";
import { makeBrief } from "../fixtures";
import { axeViolations } from "./a11y";

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("PlannerApp", () => {
  it("creates a plan from a sample, persists it and starts over", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const brief = JSON.parse(String(init?.body));
      return jsonResponse({ plan: buildPlan(brief, today), ai: "ok" });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PlannerApp today={today} />);
    await user.click(screen.getByRole("button", { name: "Neighbourhood Diwali mela" }));
    await user.click(screen.getByRole("button", { name: "Create my plan" }));

    const title = await screen.findByRole("heading", { level: 1, name: "Green Park Diwali Mela" });
    expect(title).toHaveFocus();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/plan",
      expect.objectContaining({ method: "POST" }),
    );
    expect(JSON.parse(window.localStorage.getItem("utsav.plan.v1") ?? "{}").plan.brief.title).toBe(
      "Green Park Diwali Mela",
    );

    await user.click(screen.getByRole("button", { name: "Start a new plan" }));
    expect(
      screen.getByRole("heading", { name: "Tell Utsav about your celebration" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("utsav.plan.v1")).toBeNull();
  });

  it("restores a saved plan and lets the host edit it", async () => {
    const user = userEvent.setup();
    const saved = { plan: buildPlan(makeBrief({ date: "2027-06-01" }), today), ai: "ok" };
    window.localStorage.setItem("utsav.plan.v1", JSON.stringify(saved));
    render(<PlannerApp today={today} />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Test Wedding" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit details" }));
    expect(screen.getByLabelText("Event name *")).toHaveValue("Test Wedding");
    await user.click(screen.getByRole("button", { name: "Back to my plan" }));
    expect(screen.getByRole("heading", { level: 1, name: "Test Wedding" })).toBeInTheDocument();
  });

  it("ignores corrupt storage", () => {
    window.localStorage.setItem("utsav.plan.v1", "{not json");
    window.localStorage.setItem("utsav.progress.v1", JSON.stringify({ done: "nope" }));
    render(<PlannerApp today={today} />);
    expect(
      screen.getByRole("heading", { name: "Tell Utsav about your celebration" }),
    ).toBeInTheDocument();
  });

  it("surfaces server validation errors next to fields", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            error: { message: "Some details need fixing.", fields: { city: "City not supported" } },
          },
          422,
        ),
      ),
    );
    render(<PlannerApp today={today} />);
    await user.click(screen.getByRole("button", { name: "Hyderabad wedding" }));
    await user.click(screen.getByRole("button", { name: "Create my plan" }));
    expect(await screen.findByText("Some details need fixing.")).toBeInTheDocument();
    expect(screen.getByLabelText("City")).toHaveAttribute("aria-invalid", "true");
  });

  it("builds the plan in the browser when the network fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))),
    );
    render(<PlannerApp today={today} />);
    await user.click(screen.getByRole("button", { name: "Kid's space birthday" }));
    await user.click(screen.getByRole("button", { name: "Create my plan" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Aarav turns 8" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("built in your browser");
  });
});

describe("AssistantChat", () => {
  it("sends a suggested question and announces the reply", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () =>
      jsonResponse({ reply: "Trim decor by 20%.", source: "gemini" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<AssistantChat brief={makeBrief()} />);
    await user.click(screen.getByRole("button", { name: /cut 15%/ }));
    expect(await screen.findByText("Trim decor by 20%.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Conversation" })).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(await axeViolations(container)).toEqual([]);
  });

  it("sends typed questions with history and shows errors", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ reply: "First answer", source: "gemini" }))
      .mockResolvedValueOnce(jsonResponse({ error: { message: "Too many requests." } }, 429));
    vi.stubGlobal("fetch", fetchMock);
    render(<AssistantChat brief={makeBrief()} />);
    const input = screen.getByLabelText("Your question");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await user.type(input, "Where do I start?{Enter}");
    await screen.findByText("First answer");
    await user.type(input, "And then?{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests.");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const secondBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(secondBody.history).toHaveLength(2);
  });
});
