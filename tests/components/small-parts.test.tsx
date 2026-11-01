// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatComposer } from "@/components/plan/assistant/chat-composer";
import { ChatLog } from "@/components/plan/assistant/chat-log";
import { InviteCard } from "@/components/plan/ideas/invite-card";
import { downloadText } from "@/lib/client/download";
import { axeViolations } from "./a11y";

describe("ChatComposer", () => {
  it("sends trimmed-non-empty questions and clears the box", async () => {
    const onAsk = vi.fn();
    render(<ChatComposer busy={false} onAsk={onAsk} />);
    const input = screen.getByLabelText("Your question");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await userEvent.type(input, "What first?{Enter}");
    expect(onAsk).toHaveBeenCalledWith("What first?");
    expect(input).toHaveValue("");
  });

  it("cannot send while a reply is pending", async () => {
    const onAsk = vi.fn();
    render(<ChatComposer busy onAsk={onAsk} />);
    await userEvent.type(screen.getByLabelText("Your question"), "Hello{Enter}");
    expect(onAsk).not.toHaveBeenCalled();
  });
});

describe("ChatLog", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("labels each speaker for screen readers and shows a thinking bubble", async () => {
    const { container } = render(
      <ChatLog
        turns={[
          { role: "user", content: "Hi" },
          { role: "assistant", content: "Hello" },
        ]}
        busy
      />,
    );
    expect(screen.getByText("You said:", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Utsav replied:", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Conversation" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Utsav is thinking...")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("InviteCard", () => {
  it("copies the invitation and reports failures politely", async () => {
    const writeText = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("no"));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<InviteCard message="Join us!" />);
    const copy = screen.getByRole("button", { name: "Copy invitation" });
    await userEvent.click(copy);
    expect(await screen.findByText("Invitation copied.")).toBeInTheDocument();
    await userEvent.click(copy);
    expect(await screen.findByText(/Copy failed/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Share on WhatsApp/ })).toHaveAttribute(
      "href",
      "https://wa.me/?text=Join%20us!",
    );
  });
});

describe("downloadText", () => {
  it("clicks a temporary link and revokes the URL afterwards", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => "blob:plan");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    downloadText("plan.ics", "BEGIN:VCALENDAR", "text/calendar");
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector("a[download]")).toBeNull();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:plan");
    vi.useRealTimers();
    click.mockRestore();
  });
});
