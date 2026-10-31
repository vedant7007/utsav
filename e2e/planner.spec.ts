import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
}

async function createSamplePlan(page: Page, sample: string, title: RegExp) {
  await page.goto("/");
  await page.getByRole("button", { name: sample }).click();
  await page.getByRole("button", { name: "Create my plan" }).click();
  const heading = page.getByRole("heading", { level: 1, name: title });
  await expect(heading).toBeVisible();
  return heading;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("landing page is accessible and leads to the planner", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every celebration");
  await expectAccessible(page);
  await page.getByRole("link", { name: "Start planning" }).click();
  await expect(page).toHaveURL(/#planner$/);
});

test("invalid brief shows a focused error summary", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create my plan" }).click();
  const summary = page.getByRole("alert").filter({ hasText: "Please fix" });
  await expect(summary).toBeFocused();
  await expect(page.getByLabel("Event name *")).toHaveAttribute("aria-invalid", "true");
  await expectAccessible(page);
});

test("creates a full plan and every section is accessible", async ({ page }) => {
  const heading = await createSamplePlan(page, "Hyderabad wedding", /Ananya/);
  await expect(heading).toBeFocused();
  await expect(page.getByRole("img", { name: /Budget rangoli/ })).toBeVisible();
  await expectAccessible(page);

  for (const tab of ["Budget", "Timeline", "Vendors", "Ideas", "Ask Utsav"]) {
    await page.getByRole("tab", { name: tab }).click();
    await expect(page.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", "true");
    await expectAccessible(page);
  }
});

test("what-if simulator and spend tracker update live", async ({ page }) => {
  await createSamplePlan(page, "Kid's space birthday", /Aarav/);
  await page.getByRole("tab", { name: "Budget" }).click();
  await page.getByLabel(/Guests:/).fill("60");
  await expect(page.getByText("Showing a what-if scenario.")).toBeVisible();
  await page.getByRole("button", { name: "Back to my plan" }).click();
  await page.getByLabel("Actual spend on Venue").fill("999999");
  await expect(page.getByText(/1 category is over budget/)).toBeVisible();
});

test("plan and progress survive a reload", async ({ page }) => {
  await createSamplePlan(page, "Neighbourhood Diwali mela", /Diwali Mela/);
  await page.getByRole("tab", { name: "Vendors" }).click();
  await page.getByRole("tabpanel", { name: "Vendors" }).getByRole("checkbox").first().check();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: /Diwali Mela/ })).toBeVisible();
  await page.getByRole("tab", { name: "Vendors" }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Vendors" }).getByRole("checkbox").first(),
  ).toBeChecked();
});

test("tabs work with the keyboard alone", async ({ page }) => {
  await createSamplePlan(page, "Kid's space birthday", /Aarav/);
  await page.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Budget" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Ask Utsav" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("assistant answers in offline mode", async ({ page }) => {
  await createSamplePlan(page, "Kid's space birthday", /Aarav/);
  await page.getByRole("tab", { name: "Ask Utsav" }).click();
  await page.getByLabel("Your question").fill("How can I save money?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/stretch the budget/).first()).toBeVisible();
});
