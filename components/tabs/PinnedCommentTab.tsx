"use client";

import type { JobStatus } from "@/types/api";
import StatusLight from "@/components/StatusLight";
import CopyButton from "@/components/CopyButton";

interface PinnedCommentTabProps {
  status: JobStatus | null;
  pinnedComment: string | undefined;
}

export default function PinnedCommentTab({ status, pinnedComment }: PinnedCommentTabProps) {
  return (
    <div className="tab-enter" style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600 }}>
            Pinned Comment
          </h2>
          <StatusLight status={status} size={7} showLabel />
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Post this as your first comment and pin it immediately after publishing — includes chapters and links.
        </p>
      </div>

      {status === "processing" || status === "pending" ? (
        <div style={{ flex: 1, borderRadius: "var(--radius-md)", background: "var(--surface-raised)", minHeight: "200px" }} />
      ) : status === "error" ? (
        <div style={{ padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-bad)", background: "rgba(217,83,79,0.06)", color: "var(--accent-bad)", fontSize: "13px" }}>
          Pinned comment couldn&apos;t be generated.
        </div>
      ) : !pinnedComment ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No pinned comment generated yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <CopyButton text={pinnedComment} label="Copy comment" />
          </div>

          {/* Simulated YouTube comment card */}
          <div
            style={{
              padding: "16px 18px",
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
            }}
          >
            {/* Fake avatar + channel name header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--accent-live)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#101216",
                  flexShrink: 0,
                }}
              >
                C
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>
                  @yourchannel
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  📌 Pinned by channel
                </div>
              </div>
            </div>

            <pre
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--text)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
              }}
            >
              {pinnedComment}
            </pre>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
              {pinnedComment.length.toLocaleString()} chars
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
