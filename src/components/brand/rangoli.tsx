import type { JSX } from "react";

/** Festival palette shared by the rangoli and charts. Ordered for strong neighbour contrast. */
export const RANGOLI_COLORS = [
  "#D6006F",
  "#FFB400",
  "#006D6F",
  "#F26B1D",
  "#6B2BD9",
  "#00A36C",
  "#E4007C",
  "#1E6FD9",
  "#B8860B",
  "#C2185B",
];

export interface RangoliPetal {
  id: string;
  label: string;
  share: number;
}

interface RangoliProps {
  petals: RangoliPetal[];
  size?: number;
  /** Petal to emphasise, e.g. the budget row under the pointer. */
  activeId?: string | null;
  /** Slow rotation for decorative use. Disabled by prefers-reduced-motion. */
  spin?: boolean;
  /** Accessible summary. When omitted the drawing is decorative and hidden from assistive tech. */
  label?: string;
  className?: string;
}

const VIEW = 200;
const CENTER = VIEW / 2;
const INK = "#1A1033";
/** Distance from the centre to the base of each petal. */
const PETAL_BASE = 16;
/** Petal length range in view units: the smallest share gets MIN, the largest MIN + RANGE. */
const PETAL_MIN = 34;
const PETAL_RANGE = 46;
const PETAL_MAX_WIDTH = 15;
const BLOOM_STAGGER_MS = 70;
const DIMMED_OPACITY = 0.25;

/**
 * Length of a petal. It follows the square root of the share, so small categories stay
 * visible next to large ones.
 * @param share - this category's share of the total.
 * @param maxShare - the largest share in the chart.
 */
export function petalLength(share: number, maxShare: number): number {
  return PETAL_MIN + PETAL_RANGE * Math.sqrt(share / maxShare);
}

/**
 * SVG path for one upright petal: two cubic curves meeting at the tip.
 * @param length - petal length in view units.
 * @param width - petal half-width in view units.
 */
export function petalPath(length: number, width: number): string {
  const base = CENTER - PETAL_BASE;
  const tip = base - length;
  const shoulder = base - length * 0.35;
  const neck = base - length * 0.85;
  return [
    `M ${CENTER} ${base}`,
    `C ${CENTER + width} ${shoulder}, ${CENTER + width * 0.7} ${neck}, ${CENTER} ${tip}`,
    `C ${CENTER - width * 0.7} ${neck}, ${CENTER - width} ${shoulder}, ${CENTER} ${base} Z`,
  ].join(" ");
}

/**
 * A rangoli whose petals are budget categories: each petal's length follows its share, so
 * the drawing is both the brand mark and a real chart. Petals bloom in with a staggered
 * animation on mount.
 */
export function Rangoli({
  petals,
  size = 320,
  activeId = null,
  spin = false,
  label,
  className = "",
}: RangoliProps): JSX.Element {
  const count = Math.max(petals.length, 1);
  const maxShare = Math.max(...petals.map((petal) => petal.share), 0.0001);
  const width = Math.min(PETAL_MAX_WIDTH, 6 + (120 / count) * 0.6);
  const decorative = label === undefined || label === "";

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      width={size}
      height={size}
      className={`rangoli ${spin ? "rangoli-spin" : ""} ${className}`}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={label}
      focusable="false"
    >
      <Rings />
      {petals.map((petal, index) => (
        <Petal
          key={petal.id}
          index={index}
          angle={(index * 360) / count}
          length={petalLength(petal.share, maxShare)}
          width={width}
          active={activeId === petal.id}
          dimmed={activeId !== null && activeId !== petal.id}
        />
      ))}
      <Centre count={count} />
    </svg>
  );
}

interface PetalProps {
  index: number;
  angle: number;
  length: number;
  width: number;
  active: boolean;
  dimmed: boolean;
}

function Petal({ index, angle, length, width, active, dimmed }: PetalProps): JSX.Element {
  const color = RANGOLI_COLORS[index % RANGOLI_COLORS.length];
  const opacity = dimmed ? DIMMED_OPACITY : 1;
  return (
    <g transform={`rotate(${angle} ${CENTER} ${CENTER})`}>
      <g className="rangoli-petal" style={{ animationDelay: `${index * BLOOM_STAGGER_MS}ms` }}>
        <path
          d={petalPath(length, width)}
          fill={color}
          opacity={opacity}
          stroke={INK}
          strokeWidth={active ? 2.5 : 1.2}
        />
        <circle cx={CENTER} cy={CENTER - 22 - length} r="3.2" fill={color} opacity={opacity} />
      </g>
    </g>
  );
}

function Rings(): JSX.Element {
  return (
    <>
      <circle
        cx={CENTER}
        cy={CENTER}
        r={96}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="1 6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={88}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.25"
      />
    </>
  );
}

/** The dotted inner ring and the layered centre bindu. */
function Centre({ count }: { count: number }): JSX.Element {
  return (
    <>
      {Array.from({ length: count * 2 }, (_, index) => (
        <circle
          key={index}
          cx={CENTER + 24 * Math.sin((index * Math.PI) / count)}
          cy={CENTER - 24 * Math.cos((index * Math.PI) / count)}
          r="2.4"
          fill="#FFB400"
          stroke={INK}
          strokeWidth="0.8"
        />
      ))}
      <circle cx={CENTER} cy={CENTER} r="15" fill="#D6006F" stroke={INK} strokeWidth="2" />
      <circle cx={CENTER} cy={CENTER} r="7" fill="#FFB400" stroke={INK} strokeWidth="1.5" />
      <circle cx={CENTER} cy={CENTER} r="2.5" fill="#FFFFFF" />
    </>
  );
}
