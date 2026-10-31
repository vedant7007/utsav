import type { Currency } from "./constants";

const LOCALES: Record<Currency, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
};

const formatters = new Map<Currency, Intl.NumberFormat>();

/**
 * Formats an amount as currency without decimals, e.g. ₹1,50,000. Formatters are cached
 * because Intl.NumberFormat construction is comparatively expensive.
 * @param amount - whole currency units.
 * @param currency - ISO currency code.
 */
export function formatMoney(amount: number, currency: Currency): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALES[currency], {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    formatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

/**
 * Formats YYYY-MM-DD as a readable date such as "Sat, 14 Feb 2027", in UTC so the day
 * never shifts with the viewer's time zone.
 */
export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** Formats a 0..1 share as a whole percentage. */
export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/** Today's date in the browser's own time zone, falling back to India on the server. */
export function localTodayIso(now: Date = new Date()): string {
  const zone =
    typeof window === "undefined"
      ? "Asia/Kolkata"
      : Intl.DateTimeFormat().resolvedOptions().timeZone;
  return todayIso(zone, now);
}

/** Today's date as YYYY-MM-DD in the given IANA time zone (defaults to India). */
export function todayIso(timeZone = "Asia/Kolkata", now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}
