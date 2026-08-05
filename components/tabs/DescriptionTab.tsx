"use client";

import type { JobStatus } from "@/types/api";
import StatusLight from "@/components/StatusLight";
import CopyButton from "@/components/CopyButton";

interface DescriptionTabProps {
  status: JobStatus | null;
  description: string | undefined;
}

export default function DescriptionTab({ status, description }: DescriptionTabProps) {
  return (
    <div className="tab-enter" style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600 }}>
            Description
          </h2>
          <StatusLight status={status} size={7} showLabel />
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Full YouTube description — includes chapters, links, and gear references.
        </p>
      </div>

      {status === "processing" || status === "pending" ? (
        <LoadingSkeleton />
      ) : status === "error" ? (
        <div
          style={{
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--accent-bad)",
            background: "rgba(217,83,79,0.06)",
            color: "var(--accent-bad)",
            fontSize: "13px",
          }}
        >
          Description couldn&apos;t be generated — check the transcript or video audio.
        </div>
      ) : !description ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No description generated yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, minHeight: 0 }}>
          {/* Copy action bar */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <CopyButton text={description} label="Copy description" />
          </div>

          {/* Description text */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: "16px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              overflowY: "auto",
            }}
          >
            <pre
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text)",
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
              }}
            >
              {description}
            </pre>
          </div>

          {/* Character count */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: description.length > 5000 ? "var(--accent-warn)" : "var(--text-muted)",
              }}
            >
              {description.length.toLocaleString()} / 5,000 chars
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      style={{
        flex: 1,
        borderRadius: "var(--radius-md)",
        background: "var(--surface-raised)",
        minHeight: "300px",
      }}
    />
  );
}
