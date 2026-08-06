"use client";

import type { ChecklistItem, JobStatus, ProcessResult, ThumbnailJobResponse } from "@/types/api";
import StatusLight from "@/components/StatusLight";

interface ChecklistTabProps {
  processStatus: JobStatus | null;
  thumbnailStatus: JobStatus | null;
  processResult: ProcessResult | undefined;
  thumbnailResult: ThumbnailJobResponse | undefined;
}

// ---------------------------------------------------------------------------
// Status display config — matches StatusLight colours by reusing CSS vars
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ChecklistItem["status"],
  { symbol: string; color: string; label: string }
> = {
  ok:      { symbol: "✓", color: "var(--accent-good)", label: "ok"      },
  warning: { symbol: "⚠", color: "var(--accent-warn)", label: "warn"    },
  missing: { symbol: "✗", color: "var(--accent-bad)",  label: "missing" },
};

export default function ChecklistTab({
  processStatus,
  thumbnailStatus,
  processResult,
  thumbnailResult,
}: ChecklistTabProps) {
  const anyLoading =
    processStatus === "pending" ||
    processStatus === "processing" ||
    thumbnailStatus === "pending" ||
    thumbnailStatus === "processing";

  const anyError = processStatus === "error" || thumbnailStatus === "error";

  const overallStatus: JobStatus | null = anyError
    ? "error"
    : processStatus === "done" && thumbnailStatus === "done"
    ? "done"
    : anyLoading
    ? "processing"
    : null;

  // Checklist items come from processResult.checklist (optional — absent until
  // the backend LLM prompt is updated to request this field again).
  const items: ChecklistItem[] = processResult?.checklist ?? [];
  const hasResult = !!processResult;

  const doneCount    = items.filter((i) => i.status === "ok").length;
  const warnCount    = items.filter((i) => i.status === "warning").length;
  const missingCount = items.filter((i) => i.status === "missing").length;

  return (
    <div
      className="tab-enter"
      style={{ padding: "24px", height: "100%", overflowY: "auto" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600 }}>
            Checklist
          </h2>
          <StatusLight status={overallStatus} size={7} showLabel />
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Pre-publish quality checklist — derived from both jobs. Updates as each job completes.
        </p>
      </div>

      {/* Not started yet */}
      {!hasResult && !anyLoading && (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Upload a video or transcript to generate the checklist.
        </p>
      )}

      {/* Loading skeleton */}
      {anyLoading && !hasResult && <LoadingSkeleton />}

      {/* LLM returned result but no checklist field yet */}
      {hasResult && items.length === 0 && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--surface-raised)",
            fontSize: "13px",
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          <span style={{ marginRight: "8px" }}>ℹ</span>
          Checklist data not returned by the backend yet. Ask your teammate to re-add the{" "}
          <code
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              background: "var(--bg)",
              padding: "1px 5px",
              borderRadius: "3px",
            }}
          >
            checklist
          </code>{" "}
          field to the LLM prompt in{" "}
          <code style={{ fontFamily: "var(--font-mono)", fontSize: "11px", background: "var(--bg)", padding: "1px 5px", borderRadius: "3px" }}>
            lib/llmService.ts
          </code>
          .
        </div>
      )}

      {/* Summary bar */}
      {items.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              gap: "20px",
              padding: "12px 16px",
              background: "var(--surface-raised)",
              borderRadius: "var(--radius-md)",
              marginBottom: "14px",
              alignItems: "center",
            }}
          >
            <Stat label="Done"    value={doneCount}    color="var(--accent-good)" />
            <Stat label="Warning" value={warnCount}    color="var(--accent-warn)" />
            <Stat label="Missing" value={missingCount} color="var(--accent-bad)"  />
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              {doneCount}/{items.length} complete
            </span>
          </div>

          {/* Checklist rows */}
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
            {items.map((item, i) => (
              <ChecklistRow key={i} item={item} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const { symbol, color, label } = STATUS_CONFIG[item.status];

  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 14px",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Status symbol */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "14px",
          color,
          flexShrink: 0,
          width: "16px",
          textAlign: "center",
        }}
        aria-label={label}
      >
        {symbol}
      </span>

      {/* Item text */}
      <span style={{ fontSize: "13px", color: "var(--text)", flex: 1, lineHeight: 1.4 }}>
        {item.item}
      </span>

      {/* Status badge */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
    </li>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "20px",
          fontWeight: 600,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "10px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "42px",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-raised)",
            opacity: 1 - i * 0.08,
          }}
        />
      ))}
    </div>
  );
}
