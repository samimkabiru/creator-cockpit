"use client";

import { useCallback, useRef, useState } from "react";
import StatusLight from "@/components/StatusLight";

interface UploadPanelProps {
  onSubmit: (input: { video?: File; transcript?: string }) => void;
  isJobActive: boolean;
  activeLabel?: string;
  activeStatus?: "pending" | "processing" | "done" | "error" | null;
  uploadProgress?: number;
}

type InputMode = "video" | "transcript";

export default function UploadPanel({
  onSubmit,
  isJobActive,
  activeLabel,
  activeStatus,
  uploadProgress = 0,
}: UploadPanelProps) {
  const [mode, setMode] = useState<InputMode>("video");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
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

  // ── Collapsed strip ──
  if (isJobActive) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
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

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "auto",
            }}
          >
            <div
              style={{
                width: "120px",
                height: "6px",
                borderRadius: "3px",
                background: "rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: "100%",
                  background: "var(--accent-live)",
                  transition: "width 200ms ease",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--accent-live)",
                fontWeight: 600,
              }}
            >
              Uploading {uploadProgress}%
            </span>
          </div>
        )}
      </div>
    );
  }

  // ── Full Landing Page ──
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        padding: "60px 24px 100px",
        background: "var(--bg)",
        overflowX: "hidden",
      }}
    >
      {/* ── Animated Background Orbs ── */}
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
      <div className="landing-orb landing-orb-3" />

      {/* ── Main Content ── */}
      <div
        className="animate-fade-up"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: "860px",
          width: "100%",
        }}
      >
        {/* ── Brand Mark ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, var(--accent-live), var(--accent-good))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#101216",
              fontWeight: 800,
              fontSize: "15px",
              fontFamily: "var(--font-display)",
              boxShadow: "0 0 20px rgba(232, 179, 66, 0.3)",
            }}
          >
            C
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text)",
            }}
          >
            Creator Cockpit
          </span>
        </div>

        {/* ── Hero Headline ── */}
        <h1
          className="text-gradient"
          style={{
            fontSize: "clamp(34px, 5.5vw, 56px)",
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: "18px",
            maxWidth: "760px",
          }}
        >
          Turn 2+ Hours of Manual Upload Work into 1 Click
        </h1>

        <p
          style={{
            fontSize: "clamp(14px, 2vw, 16px)",
            color: "var(--text-muted)",
            textAlign: "center",
            maxWidth: "580px",
            lineHeight: 1.65,
            marginBottom: "36px",
          }}
        >
          Upload once. Get AI chapters, 3 high-CTR titles, SEO description, hashtags, tweet,
          pinned comment, shorts clips &amp; canvas thumbnail scores — all in parallel.
        </p>

        {/* ── Floating Feature Pills ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "40px",
          }}
        >
          <FeaturePill icon="📌" label="Auto-Chapters" anim="animate-float" />
          <FeaturePill icon="🎨" label="Thumbnail Scoring" anim="animate-float-delayed" />
          <FeaturePill icon="🎬" label="Shorts Hooks" anim="animate-float" />
          <FeaturePill icon="💬" label="Pinned Comment" anim="animate-float-delayed" />
          <FeaturePill icon="📋" label="Upload Checklist" anim="animate-float" />
        </div>

        {/* ── Main Upload Card with Animated Border ── */}
        <div className="landing-card-glow" style={{ width: "100%", maxWidth: "580px" }}>
          <div
            className="glass-panel"
            style={{
              width: "100%",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* Mode tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
              {(["video", "transcript"] as InputMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: "14px 16px",
                    background: mode === m ? "var(--surface-raised)" : "transparent",
                    border: "none",
                    borderBottom:
                      mode === m
                        ? "2px solid var(--accent-live)"
                        : "2px solid transparent",
                    color: mode === m ? "var(--text)" : "var(--text-muted)",
                    fontFamily: "var(--font-display)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {m === "video" ? "Upload video" : "Paste transcript"}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div style={{ padding: "28px" }}>
              {mode === "video" ? (
                <>
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
                      gap: "12px",
                      padding: "44px 24px",
                      border: `1.5px dashed ${
                        isDragging
                          ? "var(--accent-live)"
                          : videoFile
                          ? "var(--accent-good)"
                          : "var(--border)"
                      }`,
                      borderRadius: "var(--radius-md)",
                      background: isDragging
                        ? "rgba(232, 179, 66, 0.08)"
                        : videoFile
                        ? "rgba(95, 183, 126, 0.06)"
                        : "rgba(16, 18, 22, 0.4)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <VideoIcon
                      color={
                        videoFile ? "var(--accent-good)" : "var(--text-muted)"
                      }
                    />
                    {videoFile ? (
                      <>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "13px",
                            color: "var(--accent-good)",
                            fontWeight: 600,
                          }}
                        >
                          {videoFile.name}
                        </span>
                        <span
                          style={{ fontSize: "11px", color: "var(--text-muted)" }}
                        >
                          {(videoFile.size / 1024 / 1024).toFixed(1)} MB · Click
                          to replace
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
                        <span
                          style={{ fontSize: "12px", color: "var(--text-muted)" }}
                        >
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
                    The video is processed locally — nothing is uploaded to any
                    server.
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
                      padding: "14px",
                      background: "rgba(16, 18, 22, 0.5)",
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
                    Plain text or .srt format. If the file can&apos;t be parsed,
                    you&apos;ll see a specific error.
                  </p>
                </>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  marginTop: "24px",
                  width: "100%",
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  backgroundImage: canSubmit
                    ? "linear-gradient(135deg, #e8b342 0%, #d49e2d 50%, #5fb77e 100%)"
                    : "none",
                  backgroundColor: canSubmit ? "transparent" : "var(--surface-raised)",
                  backgroundSize: "200% 200%",
                  backgroundPosition: btnHover && canSubmit ? "100% 0%" : "0% 0%",
                  color: canSubmit ? "#101216" : "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  transition: "all 400ms ease",
                  letterSpacing: "0.02em",
                  boxShadow: canSubmit
                    ? btnHover
                      ? "0 8px 32px rgba(232, 179, 66, 0.45)"
                      : "0 4px 20px rgba(232, 179, 66, 0.3)"
                    : "none",
                  transform: btnHover && canSubmit ? "translateY(-1px)" : "none",
                }}
              >
                Generate assets
              </button>
            </div>
          </div>
        </div>

        {/* ── Live Preview Strip ── */}
        <div
          className="animate-fade-up"
          style={{
            marginTop: "48px",
            width: "100%",
            maxWidth: "620px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              background: "rgba(16, 18, 22, 0.6)",
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-bad)" }} />
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-warn)" }} />
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-good)" }} />
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              preview — what you&apos;ll get
            </span>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <PreviewRow label="chapters" value="0:00 Intro · 1:42 Design · 4:15 Display · 7:30 Camera · 10:05 Daylight" />
            <PreviewRow label="title[1]" value="Pixel 9 Pro Review: Google Finally Got It Right" />
            <PreviewRow label="hashtags" value="#Pixel9Pro  #GooglePixel  #AndroidReview  #SmartphoneCamera" />
            <PreviewRow label="tweet" value="New video: I spent 30 days with the Pixel 9 Pro so you don't have to. →" />
            <PreviewRow label="thumb" value="variant_a: 88 score · contrast: 92 · faces: 90 · clutter: 72" />
          </div>
        </div>

        {/* ── Bottom tagline ── */}
        <p
          style={{
            marginTop: "36px",
            fontSize: "12px",
            color: "var(--text-muted)",
            textAlign: "center",
            maxWidth: "420px",
            lineHeight: 1.6,
          }}
        >
          Chapters, titles, description, hashtags, pinned comment, tweet, shorts candidates,
          and thumbnail scores generate in parallel. Copy everything and publish.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ──

function FeaturePill({ icon, label, anim }: { icon: string; label: string; anim: string }) {
  return (
    <div
      className={anim}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        borderRadius: "20px",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        color: "var(--text-muted)",
        fontSize: "12px",
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        backdropFilter: "blur(8px)",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--accent-live)",
          minWidth: "64px",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--text-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

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
