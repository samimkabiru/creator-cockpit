"use client";

interface UploadProgressModalProps {
  isOpen: boolean;
  fileName?: string;
  fileSizeMb?: string;
  progress: number; // 0 to 100
}

export default function UploadProgressModal({
  isOpen,
  fileName,
  fileSizeMb,
  progress,
}: UploadProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 12, 16, 0.75)",
        backdropFilter: "blur(12px)",
        padding: "24px",
      }}
    >
      <div
        className="animate-fade-up"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "32px 28px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(232, 179, 66, 0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "20px",
        }}
      >
        {/* Animated Upload Icon Circle */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(232,179,66,0.2) 0%, rgba(95,183,126,0.2) 100%)",
            border: "1px solid rgba(232,179,66,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 24px rgba(232,179,66,0.2)",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e8b342"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        {/* Title & File details */}
        <div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "6px",
            }}
          >
            Uploading to Server…
          </h3>
          {fileName && (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-muted)",
                wordBreak: "break-all",
              }}
            >
              {fileName} {fileSizeMb ? `• ${fileSizeMb} MB` : ""}
            </p>
          )}
        </div>

        {/* Progress Bar Container */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              width: "100%",
              height: "10px",
              borderRadius: "5px",
              background: "rgba(255, 255, 255, 0.08)",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                width: `${Math.max(3, progress)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #e8b342 0%, #5fb77e 100%)",
                borderRadius: "5px",
                transition: "width 250ms ease",
                boxShadow: "0 0 12px rgba(232, 179, 66, 0.6)",
              }}
            />
          </div>

          {/* Percentage & Status Text */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>
              {progress < 100 ? "Streaming video file..." : "Extracting audio track..."}
            </span>
            <span style={{ color: "#e8b342", fontWeight: 700 }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* Subtitle helper note */}
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            opacity: 0.8,
            lineHeight: 1.4,
          }}
        >
          Please keep this window open while your video is uploaded and sent for transcription.
        </p>
      </div>
    </div>
  );
}
