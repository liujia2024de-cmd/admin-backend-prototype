type AdvinciLogoProps = {
  tone?: "light" | "blue" | "slate";
  size?: "sm" | "md" | "lg";
  stacked?: boolean;
  subtitle?: string;
  className?: string;
};

const sizeMap = {
  sm: {
    logo: "h-8",
    gap: "gap-2",
    subtitle: "text-[10px]",
  },
  md: {
    logo: "h-10",
    gap: "gap-2.5",
    subtitle: "text-[11px]",
  },
  lg: {
    logo: "h-14",
    gap: "gap-3",
    subtitle: "text-xs",
  },
} as const;

const toneMap = {
  light: {
    text: "text-white",
    sub: "text-white/68",
    fill: "#ffffff",
  },
  blue: {
    text: "text-[#1B8BFA]",
    sub: "text-[#6d93bc]",
    fill: "#1B8BFA",
  },
  slate: {
    text: "text-slate-950",
    sub: "text-[#6d93bc]",
    fill: "#0f172a",
  },
} as const;

export function AdvinciLogo({
  tone = "light",
  size = "md",
  stacked = false,
  className = "",
}: AdvinciLogoProps) {
  const currentSize = sizeMap[size];
  const currentTone = toneMap[tone];

  return (
    <div className={`flex ${stacked ? "flex-col items-start" : "items-center"} ${currentSize.gap} ${className}`}>
      <svg viewBox="0 0 760 116" className={`${currentSize.logo} w-auto shrink-0`} aria-label="ADVINCI logo" preserveAspectRatio="xMinYMid meet">
        <g fill={currentTone.fill}>
          <rect x="0" y="18" width="58" height="54" rx="4" />
          <rect x="48" y="50" width="56" height="22" rx="10" />
          <circle cx="104" cy="45" r="30" />
          <path d="M46 70H83L62 107C60.7 109.3 57.3 109.3 56 107L46 70Z" />
        </g>
        <text
          x="160"
          y="88"
          fill={currentTone.fill}
          fontFamily="Arial Black, Helvetica Neue, Arial, sans-serif"
          fontSize="82"
          fontWeight="900"
          letterSpacing="-3"
        >
          ADVINCI
        </text>
      </svg>

    </div>
  );
}
