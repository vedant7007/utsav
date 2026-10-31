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
}: RangoliProps) {
  const count = Math.max(petals.length, 1);
  const maxShare = Math.max(...petals.map((petal) => petal.share), 0.0001);
  const step = 360 / count;
  const decorative = !label;

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
      {petals.map((petal, index) => {
        // Petal length follows sqrt(share) so small categories stay visible.
        const length = 34 + 46 * Math.sqrt(petal.share / maxShare);
        const width = Math.min(15, 6 + (120 / count) * 0.6);
        const color = RANGOLI_COLORS[index % RANGOLI_COLORS.length];
        const dimmed = activeId !== null && activeId !== petal.id;
        const path = `M ${CENTER} ${CENTER - 16} C ${CENTER + width} ${CENTER - 16 - length * 0.35}, ${CENTER + width * 0.7} ${CENTER - 16 - length * 0.85}, ${CENTER} ${CENTER - 16 - length} C ${CENTER - width * 0.7} ${CENTER - 16 - length * 0.85}, ${CENTER - width} ${CENTER - 16 - length * 0.35}, ${CENTER} ${CENTER - 16} Z`;
        return (
          <g key={petal.id} transform={`rotate(${index * step} ${CENTER} ${CENTER})`}>
            <g className="rangoli-petal" style={{ animationDelay: `${index * 70}ms` }}>
              <path
                d={path}
                fill={color}
                opacity={dimmed ? 0.25 : 1}
                stroke="#1A1033"
                strokeWidth={activeId === petal.id ? 2.5 : 1.2}
              />
              <circle
                cx={CENTER}
                cy={CENTER - 22 - length}
                r="3.2"
                fill={color}
                opacity={dimmed ? 0.25 : 1}
              />
            </g>
          </g>
        );
      })}
      {Array.from({ length: count * 2 }, (_, index) => (
        <circle
          key={index}
          cx={CENTER + 24 * Math.sin((index * Math.PI) / count)}
          cy={CENTER - 24 * Math.cos((index * Math.PI) / count)}
          r="2.4"
          fill="#FFB400"
          stroke="#1A1033"
          strokeWidth="0.8"
        />
      ))}
      <circle cx={CENTER} cy={CENTER} r="15" fill="#D6006F" stroke="#1A1033" strokeWidth="2" />
      <circle cx={CENTER} cy={CENTER} r="7" fill="#FFB400" stroke="#1A1033" strokeWidth="1.5" />
      <circle cx={CENTER} cy={CENTER} r="2.5" fill="#FFFFFF" />
    </svg>
  );
}
