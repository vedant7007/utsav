const INK = "#1a1033";
const WHITE = "#ffffff";
/** Relative luminance of the brand ink colour. */
const INK_LUMINANCE = 0.012;

/** Converts one sRGB channel (0..1) to linear light, per WCAG 2.x. */
function linear(value: number): number {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/**
 * WCAG relative luminance of a colour.
 * @param hex - #RRGGBB colour.
 */
export function relativeLuminance(hex: string): number {
  const channel = (offset: number): number =>
    linear(parseInt(hex.slice(offset, offset + 2), 16) / 255);
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/**
 * Picks ink or white text for a swatch, whichever has the higher WCAG contrast ratio.
 * @param hex - #RRGGBB background colour.
 */
export function readableTextOn(hex: string): typeof INK | typeof WHITE {
  const luminance = relativeLuminance(hex);
  const againstWhite = 1.05 / (luminance + 0.05);
  const againstInk = (luminance + 0.05) / (INK_LUMINANCE + 0.05);
  return againstWhite >= againstInk ? WHITE : INK;
}
