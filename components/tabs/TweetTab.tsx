"use client";

import type { JobStatus } from "@/types/api";
import StatusLight from "@/components/StatusLight";
import CopyButton from "@/components/CopyButton";

const TWEET_LIMIT = 280;

interface TweetTabProps {
  status: JobStatus | null;
  tweet: string | undefined;
}

export default function TweetTab({ status, tweet }: TweetTabProps) {
  const charCount = tweet?.length ?? 0;
  const remaining = TWEET_LIMIT - charCount;
  const isOverLimit = remaining < 0;
  const isNearLimit = remaining >= 0 && remaining <= 20;

  const counterColor = isOverLimit
    ? "var(--accent-bad)"
    : isNearLimit
    ? "var(--accent-warn)"
    : "var(--text-muted)";

  return (
    <div className="tab-enter" style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600 }}>
            Tweet
          </h2>
          <StatusLight status={status} size={7} showLabel />
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Ready-to-post tweet for your upload announcement — under 280 characters.
        </p>
      </div>

      {status === "processing" || status === "pending" ? (
        <div style={{ height: "140px", borderRadius: "var(--radius-md)", background: "var(--surface-raised)" }} />
      ) : status === "error" ? (
        <div style={{ padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-bad)", background: "rgba(217,83,79,0.06)", color: "var(--accent-bad)", fontSize: "13px" }}>
          Tweet couldn&apos;t be generated.
        </div>
      ) : !tweet ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No tweet generated yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Tweet card */}
          <div
            style={{
              padding: "18px",
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {/* Fake X/Twitter header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <XIcon />
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>Your Name</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>@yourhandle</div>
              </div>
            </div>

            <p
              style={{
                fontSize: "15px",
                color: "var(--text)",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {tweet}
            </p>
          </div>

          {/* Footer: char count + copy */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Circular progress ring */}
              <CharRing remaining={remaining} total={TWEET_LIMIT} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: counterColor }}>
                {remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over limit`}
              </span>
            </div>
            <CopyButton text={tweet} label="Copy tweet" />
          </div>
        </div>
      )}
    </div>
  );
}

/** Small SVG ring showing tweet character usage */
function CharRing({ remaining, total }: { remaining: number; total: number }) {
  const used = Math.max(0, total - remaining);
  const fraction = Math.min(1, used / total);
  const R = 10;
  const circumference = 2 * Math.PI * R;
  const strokeDashoffset = circumference * (1 - fraction);

  const color =
    remaining < 0
      ? "var(--accent-bad)"
      : remaining <= 20
      ? "var(--accent-warn)"
      : "var(--accent-good)";

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r={R} fill="none" stroke="var(--border)" strokeWidth="2.5" />
      <circle
        cx="12"
        cy="12"
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
        style={{ transition: "stroke-dashoffset 300ms ease, stroke 200ms ease" }}
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text)" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
