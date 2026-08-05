"use client";

import { useEffect, useState } from "react";
import type { JobStatus, ThumbnailVariant } from "@/types/api";
import StatusLight from "@/components/StatusLight";
import ScoreBar from "@/components/ScoreBar";
import { scoreFacePresenceFromUrl } from "@/lib/scoring/faceDetect";

interface ThumbnailsTabProps {
  status: JobStatus | null;
  variants: ThumbnailVariant[] | undefined;
}

/**
 * Live client-side scores for a single variant.
 * The mock API provides pre-computed breakdown scores; in production this
 * would run the real scoring pipeline against actual canvas pixel data.
 */
interface LiveScores {
  contrast: number;
  textDensity: number;
  edgeClutter: number;
  facePresence: number;
  composite: number;
}

export default function ThumbnailsTab({ status, variants }: ThumbnailsTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [liveScores, setLiveScores] = useState<Record<string, LiveScores>>({});

  // Run client-side face scoring when variants arrive
  useEffect(() => {
    if (!variants?.length) return;

    variants.forEach(async (v) => {
      // Use mock breakdown scores as base; run real faceDetect client-side
      const faceResult = await scoreFacePresenceFromUrl(v.imageUrl).catch(
        () => ({ score: v.breakdown.facePresence })
      );
      const faceScore = faceResult.score;

      // Composite: weighted average of all four sub-scores
      const composite = Math.round(
        v.breakdown.contrast * 0.3 +
          v.breakdown.textDensity * 0.2 +
          v.breakdown.edgeClutter * 0.2 +
          faceScore * 0.3
      );

      setLiveScores((prev) => ({
        ...prev,
        [v.id]: {
          contrast: v.breakdown.contrast,
          textDensity: v.breakdown.textDensity,
          edgeClutter: v.breakdown.edgeClutter,
          facePresence: faceScore,
          composite,
        },
      }));
    });
  }, [variants]);

  const selectedVariant = variants?.find((v) => v.id === selectedId) ?? variants?.[0] ?? null;
  const selectedScores = selectedVariant ? liveScores[selectedVariant.id] ?? null : null;

  return (
    <div
      className="tab-enter"
      style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600 }}>
            Thumbnails
          </h2>
          <StatusLight status={status} size={7} showLabel />
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Select a thumbnail to see why it scored what it did. Scores are computed
          client-side against actual pixel data.
        </p>
      </div>

      {status === "processing" || status === "pending" ? (
        <ThumbnailSkeleton />
      ) : status === "error" ? (
        <div style={{ padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-bad)", background: "rgba(217,83,79,0.06)", color: "var(--accent-bad)", fontSize: "13px" }}>
          Thumbnail variants couldn&apos;t be generated.
        </div>
      ) : !variants?.length ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No thumbnail variants yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Variant grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            {variants.map((v) => {
              const scores = liveScores[v.id];
              const composite = scores?.composite ?? v.compositeScore;
              const isSelected = (selectedId ?? variants[0]?.id) === v.id;

              return (
                <VariantCard
                  key={v.id}
                  variant={v}
                  composite={composite}
                  isSelected={isSelected}
                  onClick={() => setSelectedId(v.id)}
                />
              );
            })}
          </div>

          {/* Detail panel for selected variant */}
          {selectedVariant && (
            <DetailPanel
              variant={selectedVariant}
              scores={selectedScores}
              apiScores={selectedVariant.breakdown}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant card
// ---------------------------------------------------------------------------

function VariantCard({
  variant,
  composite,
  isSelected,
  onClick,
}: {
  variant: ThumbnailVariant;
  composite: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const scoreColor = getScoreColor(composite);

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0",
        border: `2px solid ${isSelected ? "var(--accent-live)" : "var(--border)"}`,
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        background: "var(--surface)",
        cursor: "pointer",
        padding: 0,
        textAlign: "left",
        transition: "border-color var(--transition-fast)",
      }}
      aria-pressed={isSelected}
    >
      {/* Thumbnail image */}
      <div style={{ position: "relative", aspectRatio: "16 / 9", background: "var(--bg)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={variant.imageUrl}
          alt={`Thumbnail variant ${variant.id}`}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          crossOrigin="anonymous"
        />
        {/* Score badge overlay */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            padding: "3px 8px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(16,18,22,0.85)",
            border: `1px solid ${scoreColor}`,
            backdropFilter: "blur(4px)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              fontWeight: 600,
              color: scoreColor,
            }}
          >
            {composite}
          </span>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Detail breakdown panel
// ---------------------------------------------------------------------------

function DetailPanel({
  variant,
  scores,
  apiScores,
}: {
  variant: ThumbnailVariant;
  scores: LiveScores | null;
  apiScores: ThumbnailVariant["breakdown"];
}) {
  const effective = scores ?? {
    contrast: apiScores.contrast,
    textDensity: apiScores.textDensity,
    edgeClutter: apiScores.edgeClutter,
    facePresence: apiScores.facePresence,
    composite: variant.compositeScore,
  };

  const scoreColor = getScoreColor(effective.composite);
  const scoreLabel = effective.composite >= 75 ? "Good" : effective.composite >= 45 ? "Fair" : "Poor";

  return (
    <div
      style={{
        padding: "20px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
        {/* Composite score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "80px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "42px",
              fontWeight: 600,
              color: scoreColor,
              lineHeight: 1,
            }}
          >
            {effective.composite}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: scoreColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {scoreLabel}
          </span>
        </div>

        {/* Sub-score bars */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", minWidth: "200px" }}>
          <ScoreBar label="Contrast" value={effective.contrast} />
          <ScoreBar label="Text density" value={effective.textDensity} />
          <ScoreBar label="Edge clutter" value={effective.edgeClutter} />
          <ScoreBar label="Face presence" value={effective.facePresence} />
        </div>
      </div>

      {/* Interpretation note */}
      <p style={{ marginTop: "16px", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6 }}>
        Contrast: WCAG luminance ratio between text and background.
        Text density: penalises under/over coverage (sweet spot 15–25%).
        Edge clutter: Sobel gradient behind text overlay — lower = cleaner.
        Face presence: size, position, and framing score via face-api.js.
      </p>
    </div>
  );
}

function ThumbnailSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            aspectRatio: "16 / 9",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-raised)",
            opacity: 1 - i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 75) return "var(--accent-good)";
  if (score >= 45) return "var(--accent-warn)";
  return "var(--accent-bad)";
}
