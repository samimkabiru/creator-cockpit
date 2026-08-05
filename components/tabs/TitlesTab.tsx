"use client";

import type { JobStatus } from "@/types/api";
import StatusLight from "@/components/StatusLight";
import CopyButton from "@/components/CopyButton";

interface TitlesTabProps {
  status: JobStatus | null;
  titles: string[] | undefined;
}

export default function TitlesTab({ status, titles }: TitlesTabProps) {
  return (
    <div className="tab-enter" style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600 }}>
            Titles
          </h2>
          <StatusLight status={status} size={7} showLabel />
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Three title options — pick one, or mix elements from each. Copy directly to YouTube.
        </p>
      </div>

      {status === "processing" || status === "pending" ? (
        <LoadingSkeleton />
      ) : status === "error" ? (
        <ErrorState message="Titles couldn't be generated — check the transcript or video audio." />
      ) : !titles?.length ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No titles generated yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {titles.map((title, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                padding: "14px 16px",
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flex: 1 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    paddingTop: "2px",
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text)",
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  {title}
                </p>
              </div>
              <CopyButton text={title} label="Copy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {[80, 65, 90].map((w, i) => (
        <div
          key={i}
          style={{
            height: "60px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-raised)",
            opacity: 1 - i * 0.15,
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
      }}
    >
      {message}
    </div>
  );
}
