"use client";

import type { Chapter } from "@/types/api";
import type { JobStatus } from "@/types/api";
import StatusLight from "@/components/StatusLight";

interface ChaptersTabProps {
  status: JobStatus | null;
  chapters: Chapter[] | undefined;
}

export default function ChaptersTab({ status, chapters }: ChaptersTabProps) {
  return (
    <div className="tab-enter" style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
      <TabHeader
        title="Chapters"
        status={status}
        description="Timestamped chapter markers — paste directly into YouTube's chapter field."
      />

      {status === "processing" || status === "pending" ? (
        <LoadingSkeleton rows={8} />
      ) : status === "error" ? (
        <ErrorState message="Chapters couldn't be generated — check the transcript or video audio." />
      ) : !chapters?.length ? (
        <EmptyState />
      ) : (
        <ol
          style={{
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {chapters.map((ch, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "14px",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                background: i % 2 === 0 ? "transparent" : "var(--surface-raised)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--accent-live)",
                  minWidth: "52px",
                  flexShrink: 0,
                }}
              >
                {ch.timestamp}
              </span>
              <span style={{ fontSize: "13px", color: "var(--text)" }}>
                {ch.label}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components (local to tab files — not worth extracting globally)
// ---------------------------------------------------------------------------

function TabHeader({
  title,
  status,
  description,
}: {
  title: string;
  status: JobStatus | null;
  description: string;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          {title}
        </h2>
        <StatusLight status={status} size={7} showLabel />
      </div>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );
}

function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "32px",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-raised)",
            opacity: 1 - i * 0.08,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--accent-bad)",
        background: "rgba(217,83,79,0.06)",
        color: "var(--accent-bad)",
        fontSize: "13px",
        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
      No chapters generated yet.
    </p>
  );
}
