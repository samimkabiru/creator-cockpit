"use client";

import type { JobStatus } from "@/types/api";

interface StatusLightProps {
  status: JobStatus | null;
  /** Size of the dot in pixels. Default: 8 */
  size?: number;
  /** Show a text label alongside the dot. */
  showLabel?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  JobStatus | "idle",
  { color: string; label: string; pulse: boolean }
> = {
  idle:       { color: "var(--text-muted)",   label: "Idle",       pulse: false },
  pending:    { color: "var(--text-muted)",   label: "Pending",    pulse: false },
  processing: { color: "var(--accent-live)",  label: "Processing", pulse: true  },
  done:       { color: "var(--accent-good)",  label: "Done",       pulse: false },
  error:      { color: "var(--accent-bad)",   label: "Error",      pulse: false },
};

/**
 * The signature status indicator.
 *
 * Cycles:  grey (pending) → pulsing amber (processing) → green (done) → red (error)
 *
 * The pulse animation is defined in globals.css and automatically disabled
 * when the user has prefers-reduced-motion set.
 */
export default function StatusLight({
  status,
  size = 8,
  showLabel = false,
  className = "",
}: StatusLightProps) {
  const key = status ?? "idle";
  const config = STATUS_CONFIG[key];

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      role="status"
      aria-label={config.label}
    >
      <span
        className={config.pulse ? "status-light-pulse" : undefined}
        style={{
          display: "inline-block",
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: config.color,
          flexShrink: 0,
        }}
      />
      {showLabel && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: config.color,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {config.label}
        </span>
      )}
    </span>
  );
}
