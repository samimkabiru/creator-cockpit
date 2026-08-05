interface ScoreBarProps {
  /** Label shown to the left of the bar */
  label: string;
  /** Score value 0-100 */
  value: number;
  /** Bar height in px. Default: 4 */
  height?: number;
  /** Show numeric value at the right end. Default: true */
  showValue?: boolean;
}

/**
 * Horizontal score bar used in thumbnail breakdown panels.
 *
 * Color thresholds (match spec):
 *  ≥ 75  → accent-good (green)
 *  45–74 → accent-warn (orange)
 *  < 45  → accent-bad  (red)
 *
 * The numeric value renders in IBM Plex Mono per the spec's rule that
 * "every number in this app renders in this face".
 */
export default function ScoreBar({
  label,
  value,
  height = 4,
  showValue = true,
}: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  let barColor: string;
  if (clamped >= 75) {
    barColor = "var(--accent-good)";
  } else if (clamped >= 45) {
    barColor = "var(--accent-warn)";
  } else {
    barColor = "var(--accent-bad)";
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      {/* Row: label + numeric value */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
        {showValue && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: barColor,
              fontWeight: 500,
            }}
          >
            {clamped}
          </span>
        )}
      </div>

      {/* Track + fill */}
      <div
        style={{
          height,
          borderRadius: height / 2,
          background: "var(--border)",
          overflow: "hidden",
        }}
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          style={{
            height: "100%",
            width: `${clamped}%`,
            borderRadius: height / 2,
            background: barColor,
            transition: "width 400ms ease",
          }}
        />
      </div>
    </div>
  );
}
