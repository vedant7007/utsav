// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Rangoli } from "@/components/brand/rangoli";
import { Hero } from "@/components/landing/hero";
import { BudgetPanel } from "@/components/plan/budget-panel";
import { IdeasPanel, readableTextOn } from "@/components/plan/ideas-panel";
import { TimelinePanel } from "@/components/plan/timeline-panel";
import { buildPlan } from "@/lib/planner/plan";
import { makeBrief, TODAY } from "../fixtures";
import { axeViolations } from "./a11y";

const plan = buildPlan(makeBrief({ budget: 1_000_000, guests: 200 }), TODAY);

describe("Hero", () => {
  it("renders one h1 and a decorative rangoli without accessibility violations", async () => {
    const { container } = render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Every celebration");
    expect(container.querySelector("svg.rangoli")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "Start planning" })).toHaveAttribute(
      "href",
      "#planner",
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Rangoli", () => {
  it("draws one petal per category and exposes a label when meaningful", () => {
    const { container } = render(
      <Rangoli
        petals={[
          { id: "a", label: "A", share: 0.6 },
          { id: "b", label: "B", share: 0.4 },
        ]}
        label="Budget"
        activeId="a"
      />,
    );
    expect(container.querySelectorAll(".rangoli-petal")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Budget" })).toBeInTheDocument();
  });
});

describe("BudgetPanel what-if simulator", () => {
  it("recomputes every line and the per-guest figure, then resets", async () => {
    const onActual = vi.fn();
    render(
      <BudgetPanel
        brief={plan.brief}
        budget={plan.budget}
        actuals={{}}
        onActualChange={onActual}
      />,
    );
    const guests = screen.getByLabelText(/Guests:/);
    // Range inputs are driven through change events; doubling guests halves per-guest spend.
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(guests, { target: { value: "400" } });
    expect(screen.getByText("Showing a what-if scenario.")).toBeInTheDocument();
    expect(screen.getByText("Per guest").nextElementSibling).toHaveTextContent("₹2,500");
    const budgetSlider = screen.getByLabelText(/Total budget:/);
    fireEvent.change(budgetSlider, { target: { value: "400000" } });
    expect(screen.getByText(/Tight budget/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Back to my plan" }));
    expect(screen.queryByText("Showing a what-if scenario.")).not.toBeInTheDocument();
    expect(screen.getByText("Per guest").nextElementSibling).toHaveTextContent("₹5,000");
  });

  it("highlights a row when it is focused and passes spend changes up", async () => {
    const user = userEvent.setup();
    const onActual = vi.fn();
    const { container } = render(
      <BudgetPanel
        brief={plan.brief}
        budget={plan.budget}
        actuals={{}}
        onActualChange={onActual}
      />,
    );
    const input = screen.getByLabelText("Actual spend on Catering");
    await user.type(input, "5");
    expect(onActual).toHaveBeenCalledWith("catering", 5);
    expect(input.closest("tr")).toHaveClass("bg-sun");
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("TimelinePanel", () => {
  it("shows the event-day run sheet", () => {
    render(<TimelinePanel title="Test" timeline={plan.timeline} runSheet={plan.ideas.runSheet} />);
    const sheet = screen.getByRole("complementary", { name: "Event-day run sheet" });
    expect(within(sheet).getAllByRole("listitem")).toHaveLength(plan.ideas.runSheet.length);
  });
});

describe("IdeasPanel", () => {
  it("shows palette swatches with readable text and copies the invitation", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { container } = render(<IdeasPanel ideas={plan.ideas} source="curated" />);
    expect(
      within(screen.getByRole("list", { name: "Colour palette" })).getAllByRole("listitem"),
    ).toHaveLength(plan.ideas.palette.length);
    await user.click(screen.getByRole("button", { name: "Copy invitation" }));
    expect(writeText).toHaveBeenCalledWith(plan.ideas.inviteMessage);
    expect(screen.getByText("Invitation copied.")).toBeInTheDocument();
    const share = screen.getByRole("link", { name: /Share on WhatsApp/ });
    expect(share.getAttribute("href")).toContain("https://wa.me/?text=");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("reports a failed copy", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("no")) },
      configurable: true,
    });
    render(<IdeasPanel ideas={plan.ideas} source="gemini" />);
    await user.click(screen.getByRole("button", { name: "Copy invitation" }));
    expect(screen.getByText(/Copy failed/)).toBeInTheDocument();
    expect(screen.getByText(/Personalised by Google Gemini/)).toBeInTheDocument();
  });

  it("picks ink text on light colours and white on dark ones", () => {
    expect(readableTextOn("#FFFFFF")).toBe("#1a1033");
    expect(readableTextOn("#FFB400")).toBe("#1a1033");
    expect(readableTextOn("#1A1033")).toBe("#ffffff");
    expect(readableTextOn("#990033")).toBe("#ffffff");
  });
});
