"use client";

import { useState } from "react";
import type { JobStatus, ShortCandidate } from "@/types/api";
import StatusLight from "@/components/StatusLight";
import { renderAndDownloadShort, parseTimestampToSeconds } from "@/lib/shortsClipper";

interface ShortsTabProps {
  status: JobStatus | null;
  shorts: ShortCandidate[] | undefined;
  videoFile: File | null;
}

export default function ShortsTab({ status, shorts, videoFile }: ShortsTabProps) {
  const [renderingIndex, setRenderingIndex] = useState<number | null>(null);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = status === "pending" || status === "processing";
  const hasShorts = shorts && shorts.length > 0;

  const handleDownload = async (candidate: ShortCandidate, index: number) => {
    if (!videoFile) {
      setErrorMessage("No local video file available for clipping (transcript-only mode).");
      return;
    }

    setRenderingIndex(index);
    setRenderProgress(0);
    setErrorMessage(null);

    try {
      await renderAndDownloadShort(
        videoFile,
        candidate.start,
        candidate.end,
        `short_${candidate.start}`,
        (percent) => setRenderProgress(percent)
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Rendering failed: ${msg}`);
    } finally {
      setRenderingIndex(null);
      setRenderProgress(0);
    }
  };

  return (
    <div
      className="tab-enter"
      style={{ padding: "24px", height: "100%", overflowY: "auto" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600 }}>
            YouTube Shorts Candidates
          </h2>
          <StatusLight status={status} size={7} showLabel />
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          AI-identified viral highlights under 60 seconds. Render and download 9:16 vertical shorts directly in your browser.
        </p>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            background: "rgba(224, 86, 86, 0.12)",
            border: "1px solid var(--accent-bad)",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            color: "var(--accent-bad)",
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Empty / Loading state */}
      {isLoading && <LoadingSkeleton />}

      {!isLoading && !hasShorts && (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Upload a video to detect viral YouTube Shorts candidates.
        </p>
      )}

      {/* Candidates List */}
      {!isLoading && hasShorts && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {shorts.map((candidate, idx) => {
            const startSec = parseTimestampToSeconds(candidate.start);
            const endSec = parseTimestampToSeconds(candidate.end);
            const durationSec = Math.max(1, endSec - startSec);
            const isRenderingThis = renderingIndex === idx;

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  padding: "18px",
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                {/* Top info row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        background: "rgba(232, 179, 66, 0.15)",
                        color: "var(--accent-live)",
                        border: "1px solid rgba(232, 179, 66, 0.3)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      {candidate.start} – {candidate.end}
                    </span>

                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      Duration: {durationSec}s
                    </span>
                  </div>

                  {/* Render & Download button */}
                  <button
                    onClick={() => handleDownload(candidate, idx)}
                    disabled={renderingIndex !== null}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      background: isRenderingThis
                        ? "var(--surface)"
                        : "linear-gradient(135deg, #e8b342 0%, #d49e2e 100%)",
                      color: isRenderingThis ? "var(--text-muted)" : "#000",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: renderingIndex !== null ? "not-allowed" : "pointer",
                      boxShadow: isRenderingThis ? "none" : "0 2px 10px rgba(232, 179, 66, 0.3)",
                      transition: "transform 150ms ease, opacity 150ms ease",
                    }}
                  >
                    {isRenderingThis ? (
                      <>
                        <span className="animate-spin" style={{ display: "inline-block" }}>
                          ⏳
                        </span>
                        Rendering 9:16 Short ({renderProgress}%)
                      </>
                    ) : (
                      <>
                        <DownloadIcon />
                        Render & Download Short (9:16)
                      </>
                    )}
                  </button>
                </div>

                {/* AI Rationale */}
                <div>
                  <h4
                    style={{
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    AI Rationale
                  </h4>
                  <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.5 }}>
                    {candidate.reason}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "100px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-raised)",
            opacity: 1 - i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
