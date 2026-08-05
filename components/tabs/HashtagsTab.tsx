"use client";

import type { JobStatus } from "@/types/api";
import StatusLight from "@/components/StatusLight";
import CopyButton from "@/components/CopyButton";

interface HashtagsTabProps {
  status: JobStatus | null;
  hashtags: string[] | undefined;
}

export default function HashtagsTab({ status, hashtags }: HashtagsTabProps) {
  const allTagsText = hashtags?.join(" ") ?? "";

  return (
    <div className="tab-enter" style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600 }}>
            Hashtags
          </h2>
          <StatusLight status={status} size={7} showLabel />
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          5–8 relevant hashtags. Paste at the end of your description for discoverability.
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
          Hashtags couldn&apos;t be generated.
        </div>
      ) : !hashtags?.length ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No hashtags generated yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Tag pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {hashtags.map((tag, i) => (
              <TagPill key={i} tag={tag} />
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--border)" }} />

          {/* Copy all as one string */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-muted)",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {allTagsText}
            </span>
            <CopyButton text={allTagsText} label="Copy all" />
          </div>

          {/* Count badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              {hashtags.length} tags
            </span>
            {hashtags.length >= 5 && hashtags.length <= 8 ? (
              <span style={{ fontSize: "11px", color: "var(--accent-good)" }}>✓ optimal range</span>
            ) : (
              <span style={{ fontSize: "11px", color: "var(--accent-warn)" }}>
                ⚠ YouTube recommends 5–8
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TagPill({ tag }: { tag: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "100px",
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        color: "var(--accent-live)",
        fontWeight: 500,
      }}
    >
      {tag}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {[60, 80, 100, 72, 88, 65].map((w, i) => (
        <div
          key={i}
          style={{
            width: w,
            height: "28px",
            borderRadius: "100px",
            background: "var(--surface-raised)",
            opacity: 1 - i * 0.1,
          }}
        />
      ))}
    </div>
  );
}
