// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlannerForm } from "@/components/planner/planner-form";
import { TODAY } from "../fixtures";
import { axeViolations } from "./a11y";

describe("PlannerForm", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<PlannerForm today={TODAY} busy={false} onSubmit={vi.fn()} />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("shows a focused error summary and marks invalid fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(<PlannerForm today={TODAY} busy={false} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Create my plan" }));

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(summary).toHaveTextContent("Give your event a name");
    expect(screen.getByLabelText("Event name *")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Event name *")).toHaveAccessibleDescription(
      "Give your event a name",
    );
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("fills a sample and submits a validated brief", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PlannerForm today={TODAY} busy={false} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Kid's space birthday" }));
    await user.click(screen.getByRole("button", { name: "Create my plan" }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "birthday",
        title: "Aarav turns 8",
        guests: 30,
        budget: 40_000,
      }),
    );
  });

  it("rejects a past date", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PlannerForm today={TODAY} busy={false} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Kid's space birthday" }));
    const date = screen.getByLabelText("Event date *");
    await user.clear(date);
    await user.type(date, "2026-01-01");
    await user.click(screen.getByRole("button", { name: "Create my plan" }));
    expect(screen.getByRole("alert")).toHaveTextContent("today or later");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("limits priorities to three", async () => {
    const user = userEvent.setup();
    render(<PlannerForm today={TODAY} busy={false} onSubmit={vi.fn()} />);
    for (const name of ["Venue", "Decor", "Photography"]) {
      await user.click(screen.getByRole("checkbox", { name }));
    }
    expect(screen.getByRole("checkbox", { name: "Entertainment" })).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: "Venue" }));
    expect(screen.getByRole("checkbox", { name: "Entertainment" })).toBeEnabled();
  });

  it("shows server errors and a busy state", () => {
    render(
      <PlannerForm
        today={TODAY}
        busy
        serverErrors={{ date: "Server says no" }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Server says no");
    expect(screen.getByRole("button", { name: /Planning your celebration/ })).toBeDisabled();
  });
});
