"use client";

import { useCallback, useRef, useState } from "react";
import StatusLight from "@/components/StatusLight";

interface UploadPanelProps {
  /** Called when the user submits. Fires startProcessJob + startThumbnailJob. */
  onSubmit: (input: { video?: File; transcript?: string }) => void;
  /** Once a job is running, the panel collapses to a strip. */
  isJobActive: boolean;
  /** Filename or source label to show in collapsed strip. */
  activeLabel?: string;
  /** Current overall job status for the status light in collapsed mode. */
  activeStatus?: "pending" | "processing" | "done" | "error" | null;
}

type InputMode = "video" | "transcript";

export default function UploadPanel({
  onSubmit,
  isJobActive,
  activeLabel,
  activeStatus,
}: UploadPanelProps) {
  const [mode, setMode] = useState<InputMode>("video");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Drag-and-drop handlers
  // ---------------------------------------------------------------------------
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setMode("video");
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setVideoFile(file);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (mode === "video" && !videoFile) return;
    if (mode === "transcript" && !transcript.trim()) return;

    onSubmit({
      video: mode === "video" ? videoFile ?? undefined : undefined,
      transcript: mode === "transcript" ? transcript.trim() : undefined,
    });
  }, [mode, videoFile, transcript, onSubmit]);

  const canSubmit =
    (mode === "video" && !!videoFile) ||
    (mode === "transcript" && transcript.trim().length > 0);

  // ---------------------------------------------------------------------------
  // Collapsed strip (shown after job starts)
  // ---------------------------------------------------------------------------
  if (isJobActive) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 16px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          minHeight: "40px",
        }}
      >
        <StatusLight status={activeStatus ?? null} showLabel />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {activeLabel ?? "Processing…"}
        </span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Full upload panel (landing state)
  // ---------------------------------------------------------------------------
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "40px 24px",
        background: "var(--bg)",
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "40px",
        }}
      >
        Creator Cockpit
      </div>

      {/* Main card */}
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {/* Mode tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {(["video", "transcript"] as InputMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: mode === m ? "var(--surface-raised)" : "transparent",
                border: "none",
                borderBottom: mode === m ? "2px solid var(--accent-live)" : "2px solid transparent",
                color: mode === m ? "var(--text)" : "var(--text-muted)",
                fontFamily: "var(--font-display)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "color var(--transition-fast), background var(--transition-fast)",
                textTransform: "capitalize",
              }}
            >
              {m === "video" ? "Upload video" : "Paste transcript"}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div style={{ padding: "24px" }}>
          {mode === "video" ? (
            <>
              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  fileInputRef.current?.click()
                }
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "40px 24px",
                  border: `1px dashed ${isDragging ? "var(--accent-live)" : videoFile ? "var(--accent-good)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)",
                  background: isDragging
                    ? "rgba(232,179,66,0.05)"
                    : videoFile
                    ? "rgba(95,183,126,0.05)"
                    : "var(--bg)",
                  cursor: "pointer",
                  transition: "border-color var(--transition-fast), background var(--transition-fast)",
                }}
              >
                <VideoIcon color={videoFile ? "var(--accent-good)" : "var(--text-muted)"} />

                {videoFile ? (
                  <>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        color: "var(--accent-good)",
                        fontWeight: 500,
                      }}
                    >
                      {videoFile.name}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {(videoFile.size / 1024 / 1024).toFixed(1)} MB · Click to replace
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "14px",
                        color: "var(--text)",
                        fontWeight: 500,
                      }}
                    >
                      Drop a video file here
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      or click to browse · MP4, MOV, WebM
                    </span>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                aria-hidden="true"
              />

              <p
                style={{
                  marginTop: "12px",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                The video is processed locally — nothing is uploaded to any server.
              </p>
            </>
          ) : (
            <>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste a plain-text transcript or .srt file contents here…"
                rows={10}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  lineHeight: 1.7,
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color var(--transition-fast)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--accent-live)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--border)")
                }
              />
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                }}
              >
                Plain text or .srt format. If the file can&apos;t be parsed, you&apos;ll see a specific error.
              </p>
            </>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: canSubmit ? "var(--accent-live)" : "var(--surface-raised)",
              color: canSubmit ? "#101216" : "var(--text-muted)",
              fontFamily: "var(--font-display)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: canSubmit ? "pointer" : "not-allowed",
              transition: "background var(--transition-fast), color var(--transition-fast)",
              letterSpacing: "0.02em",
            }}
          >
            Generate assets
          </button>
        </div>
      </div>

      {/* Empty state copy */}
      <p
        style={{
          marginTop: "24px",
          fontSize: "12px",
          color: "var(--text-muted)",
          textAlign: "center",
          maxWidth: "380px",
          lineHeight: 1.6,
        }}
      >
        Upload a video or paste a transcript to begin. Chapters, titles, description,
        hashtags, pinned comment, tweet, and thumbnails will generate in parallel.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline icon — no icon library dependency
// ---------------------------------------------------------------------------
function VideoIcon({ color }: { color: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="16" height="16" rx="2" />
      <path d="M18 9l4-2v10l-4-2" />
    </svg>
  );
}
