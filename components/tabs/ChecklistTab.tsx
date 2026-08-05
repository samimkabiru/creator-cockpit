"use client";

import type { ChecklistItem, JobStatus, ProcessResult, ThumbnailJobResponse } from "@/types/api";
import StatusLight from "@/components/StatusLight";

interface ChecklistTabProps {
  processStatus: JobStatus | null;
  thumbnailStatus: JobStatus | null;
  processResult: ProcessResult | undefined;
  thumbnailResult: ThumbnailJobResponse | undefined;
}

/**
 * ChecklistTab derives its display from BOTH job results.
 * It has no dedicated job — it's computed from processResult + thumbnailResult.
 */
export default function ChecklistTab({
  processStatus,
  thumbnailStatus,
  processResult,
  thumbnailResult,
}: ChecklistTabProps) {
  const bothDone = processStatus === "done" && thumbnailStatus === "done";
  const anyError = processStatus === "error" || thumbnailStatus === "error";
  const anyLoading =
    processStatus === "pending" ||
    processStatus === "processing" ||
    thumbnailStatus === "pending" ||
    thumbnailStatus === "processing";

  // Derive checklist by overlaying real data onto the mock checklist from the API,
  // then appending thumbnail-specific items based on thumbnailResult.
  const items = deriveChecklist(processResult, thumbnailResult);

  const overallStatus: JobStatus | null = anyError
    ? "error"
    : bothDone
    ? "done"
    : anyLoading
    ? "processing"
    : null;

  const doneCount = items.filter((i) => i.status === "ok").length;
  const warnCount = items.filter((i) => i.status === "warning").length;
  const missingCount = items.filter((i) => i.status === "missing").length;

  return (
    <div className="tab-enter" style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600 }}>
            Checklist
          </h2>
          <StatusLight status={overallStatus} size={7} showLabel />
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Pre-publish checklist — derived from both jobs. Items update as each job completes.
        </p>
      </div>

      {/* Summary bar */}
      {items.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "16px",
            padding: "12px 16px",
            background: "var(--surface-raised)",
            borderRadius: "var(--radius-md)",
            marginBottom: "16px",
          }}
        >
          <Stat label="Done" value={doneCount} color="var(--accent-good)" />
          <Stat label="Warning" value={warnCount} color="var(--accent-warn)" />
          <Stat label="Missing" value={missingCount} color="var(--accent-bad)" />
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", alignSelf: "center" }}>
            {doneCount}/{items.length} complete
          </span>
        </div>
      )}

      {anyLoading && items.length === 0 ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Upload a video or transcript to generate the checklist.
        </p>
      ) : (
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
          {items.map((item, i) => (
            <ChecklistRow key={i} item={item} loading={anyLoading && !processResult} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checklist row
// ---------------------------------------------------------------------------

function ChecklistRow({
  item,
  loading,
}: {
  item: ChecklistItem;
  loading: boolean;
}) {
  const { icon, color } = STATUS_DISPLAY[item.status];

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
        opacity: loading ? 0.5 : 1,
        transition: "opacity 200ms ease",
      }}
    >
      <span style={{ fontSize: "15px", flexShrink: 0, color }}>{icon}</span>
      <span style={{ fontSize: "13px", color: "var(--text)", flex: 1 }}>{item.item}</span>
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
        {item.status}
      </span>
    </li>
  );
}

const STATUS_DISPLAY: Record<
  ChecklistItem["status"],
  { icon: string; color: string }
> = {
  ok:      { icon: "✓", color: "var(--accent-good)" },
  warning: { icon: "⚠", color: "var(--accent-warn)" },
  missing: { icon: "✗", color: "var(--accent-bad)"  },
};

// ---------------------------------------------------------------------------
// Derive checklist from real job data
// ---------------------------------------------------------------------------

function deriveChecklist(
  processResult: ProcessResult | undefined,
  thumbnailResult: ThumbnailJobResponse | undefined
): ChecklistItem[] {
  if (!processResult) {
    // Return a "pending" version of the full list while jobs run
    return BASE_CHECKLIST.map((label) => ({ item: label, status: "warning" as const }));
  }

  const items: ChecklistItem[] = [...(processResult.checklist ?? [])];

  // Override thumbnail item based on actual thumbnail job
  const thumbIdx = items.findIndex((i) =>
    i.item.toLowerCase().includes("thumbnail")
  );

  if (thumbIdx !== -1) {
    if (thumbnailResult?.status === "done" && thumbnailResult.variants?.length) {
      items[thumbIdx] = {
        item: items[thumbIdx].item,
        status: "ok",
      };
    } else if (thumbnailResult?.status === "error") {
      items[thumbIdx] = {
        item: items[thumbIdx].item,
        status: "missing",
      };
    }
  }

  return items;
}

const BASE_CHECKLIST = [
  "Title — 3 variants written",
  "Description — written and includes chapters",
  "Hashtags — 5–8 relevant tags",
  "Chapters — timestamped and labeled",
  "Pinned comment — ready to paste",
  "Tweet — written and under 280 chars",
  "Shorts candidates — identified",
  "Thumbnail — reviewed and scored",
  "End screen — configured in YouTube Studio",
  "Cards — added at relevant timestamps",
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 600, color, lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
