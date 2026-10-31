import axe from "axe-core";

/**
 * Runs axe-core against a rendered container and returns violations. Color contrast is
 * skipped because jsdom does not compute styles; contrast is verified in the browser audit.
 */
export async function axeViolations(container: Element): Promise<axe.Result[]> {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  return results.violations;
}
