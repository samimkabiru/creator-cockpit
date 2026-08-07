"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import UploadPanel from "@/components/UploadPanel";
import UploadProgressModal from "@/components/UploadProgressModal";
import TabRail, { type TabId } from "@/components/TabRail";
import StatusLight from "@/components/StatusLight";

import ChaptersTab from "@/components/tabs/ChaptersTab";
import TitlesTab from "@/components/tabs/TitlesTab";
import DescriptionTab from "@/components/tabs/DescriptionTab";
import HashtagsTab from "@/components/tabs/HashtagsTab";
import PinnedCommentTab from "@/components/tabs/PinnedCommentTab";
import TweetTab from "@/components/tabs/TweetTab";
import ThumbnailsTab from "@/components/tabs/ThumbnailsTab";
import ChecklistTab from "@/components/tabs/ChecklistTab";

import {
  startProcessJob,
  getProcessJob,
  getThumbnailJob,
  generateAIThumbnails,
} from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { extractFramesAtTimestamps, extractEvenlySpacedFrames } from "@/lib/frameExtractor";
import { extractAudioInBrowser } from "@/lib/browserAudioExtractor";

import type { ProcessJobResponse, ThumbnailJobResponse } from "@/types/api";

export default function Home() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [processJobId, setProcessJobId] = useState<string | null>(null);
  const [thumbnailJobId, setThumbnailJobId] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string>("Processing…");
  const [activeTab, setActiveTab] = useState<TabId>("chapters");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadFileSizeMb, setUploadFileSizeMb] = useState<string>("");
  const [thumbnailSkipReason, setThumbnailSkipReason] = useState<string | null>(null);

  // Keep a ref to the uploaded video file for frame extraction later
  const videoFileRef = useRef<File | null>(null);
  // Track whether we've already kicked off thumbnail generation
  const thumbGenStarted = useRef(false);

  const isJobActive = !!processJobId || !!thumbnailJobId || isUploading;

  // ---------------------------------------------------------------------------
  // Polling — only poll valid job IDs (not uploading state)
  // ---------------------------------------------------------------------------
  const processGetter = useCallback(
    () => getProcessJob(processJobId!),
    [processJobId]
  );

  const thumbnailGetter = useCallback(
    () => getThumbnailJob(thumbnailJobId!),
    [thumbnailJobId]
  );

  const {
    data: processResponse,
    status: processStatus,
  } = usePolling<ProcessJobResponse>({
    getter: processGetter,
    enabled: !!processJobId && !processJobId.startsWith("proc_uploading"),
    intervalMs: 2000,
    getStatus: (d) => d.status,
  });

  const {
    data: thumbnailResponse,
    status: thumbnailStatus,
  } = usePolling<ThumbnailJobResponse>({
    getter: thumbnailGetter,
    enabled: !!thumbnailJobId,
    intervalMs: 2000,
    getStatus: (d) => d.status,
  });

  // ---------------------------------------------------------------------------
  // Auto-trigger thumbnail generation when process job completes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (
      processStatus !== "done" ||
      !processResponse?.result ||
      thumbGenStarted.current
    ) {
      return;
    }

    const result = processResponse.result;
    const titles = result.titles;
    const description = result.description;
    const videoFile = videoFileRef.current;

    if (!titles || titles.length === 0) return;

    thumbGenStarted.current = true;

    (async () => {
      try {
        let frames: string[];

        if (videoFile) {
          // Extract 3-4 frames at chapter timestamps
          const chapters = result.chapters;
          if (chapters && chapters.length >= 3) {
            const timestamps = chapters.slice(0, 4).map((c) => c.timestamp);
            frames = await extractFramesAtTimestamps(videoFile, timestamps);
          } else {
            frames = await extractEvenlySpacedFrames(videoFile, 4);
          }
        } else {
          console.log("No video file available for thumbnail generation");
          setThumbnailSkipReason("No video file provided (transcript-only mode).");
          return;
        }

        // Generate AI thumbnails sequentially
        const thumbRes = await generateAIThumbnails({
          titles,
          description,
          frames,
        });

        setThumbnailJobId(thumbRes.jobId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setThumbnailSkipReason(
          `Thumbnail generation failed — check your Qwen/DashScope API key and try again. (${msg})`
        );
        console.error("Failed to generate thumbnails:", err);
      }
    })();
  }, [processStatus, processResponse]);

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(
    async (input: { video?: File; transcript?: string }) => {
      const label = input.video
        ? input.video.name
        : `Transcript (${(input.transcript?.length ?? 0).toLocaleString()} chars)`;
      setActiveLabel(label);
      setUploadProgress(0);
      setThumbnailSkipReason(null);

      videoFileRef.current = input.video ?? null;
      thumbGenStarted.current = false;

      if (input.video) {
        setIsUploading(true);
        setUploadFileName(input.video.name);
        setUploadFileSizeMb((input.video.size / 1024 / 1024).toFixed(1));
      }

      try {
        let fileToUpload: File | undefined = input.video;
        if (input.video) {
          // Extract lightweight audio in browser to shrink ~120MB video down to ~2.5MB audio
          fileToUpload = await extractAudioInBrowser(input.video);
        }

        const processRes = await startProcessJob(
          { video: fileToUpload, transcript: input.transcript },
          (percent) => {
            setUploadProgress(percent);
          }
        );

        // Upload complete — set real job ID and turn off upload modal
        setProcessJobId(processRes.jobId);
        setIsUploading(false);
      } catch (err: unknown) {
        setIsUploading(false);
        setProcessJobId(null);
        const msg = err instanceof Error ? err.message : String(err);
        alert(`Upload failed: ${msg}`);
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Overall status
  // ---------------------------------------------------------------------------
  const overallStatus = isUploading
    ? "processing"
    : processStatus === "error" || thumbnailStatus === "error"
    ? "error"
    : processStatus === "processing" || thumbnailStatus === "processing"
    ? "processing"
    : processStatus === "done" && (thumbnailStatus === "done" || !thumbnailJobId)
    ? "done"
    : processStatus === "pending" || thumbnailStatus === "pending"
    ? "pending"
    : null;

  // ---------------------------------------------------------------------------
  // Tab content renderer
  // ---------------------------------------------------------------------------
  const result = processResponse?.result;

  function renderTab() {
    switch (activeTab) {
      case "chapters":
        return <ChaptersTab status={isUploading ? "processing" : processStatus} chapters={result?.chapters} />;
      case "titles":
        return <TitlesTab status={isUploading ? "processing" : processStatus} titles={result?.titles} />;
      case "description":
        return <DescriptionTab status={isUploading ? "processing" : processStatus} description={result?.description} />;
      case "hashtags":
        return <HashtagsTab status={isUploading ? "processing" : processStatus} hashtags={result?.hashtags} />;
      case "pinned-comment":
        return <PinnedCommentTab status={isUploading ? "processing" : processStatus} pinnedComment={result?.pinnedComment} />;
      case "tweet":
        return <TweetTab status={isUploading ? "processing" : processStatus} tweet={result?.tweet} />;
      case "thumbnails":
        return (
          <ThumbnailsTab
            status={isUploading ? "processing" : thumbnailStatus}
            variants={thumbnailResponse?.variants}
            skipReason={thumbnailSkipReason ?? undefined}
          />
        );
      case "checklist":
        return (
          <ChecklistTab
            processStatus={isUploading ? "processing" : processStatus}
            thumbnailStatus={isUploading ? "processing" : thumbnailStatus}
            processResult={result}
            thumbnailResult={thumbnailResponse ?? undefined}
          />
        );
    }
  }

  // ---------------------------------------------------------------------------
  // Landing state
  // ---------------------------------------------------------------------------
  if (!isJobActive) {
    return (
      <>
        <UploadProgressModal
          isOpen={isUploading}
          fileName={uploadFileName}
          fileSizeMb={uploadFileSizeMb}
          progress={uploadProgress}
        />
        <UploadPanel
          onSubmit={handleSubmit}
          isJobActive={false}
          activeLabel={undefined}
          activeStatus={null}
          uploadProgress={uploadProgress}
        />
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Active state
  // ---------------------------------------------------------------------------
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* Upload progress modal overlay */}
      <UploadProgressModal
        isOpen={isUploading}
        fileName={uploadFileName}
        fileSizeMb={uploadFileSizeMb}
        progress={uploadProgress}
      />

      {/* App header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "0 20px",
          height: "48px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Creator Cockpit
        </span>

        <div style={{ width: "1px", height: "16px", background: "var(--border)" }} />

        <StatusLight status={overallStatus} size={8} showLabel />

        <div style={{ flex: 1 }} />

        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "300px",
          }}
        >
          {activeLabel}
        </span>
      </header>

      {/* Collapsed upload strip */}
      <div style={{ flexShrink: 0 }}>
        <UploadPanel
          onSubmit={handleSubmit}
          isJobActive={true}
          activeLabel={activeLabel}
          activeStatus={overallStatus}
          uploadProgress={uploadProgress}
        />
      </div>

      {/* Main workspace: tab rail + content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <TabRail
          activeTab={activeTab}
          onTabChange={setActiveTab}
          processStatus={isUploading ? "processing" : processStatus}
          thumbnailStatus={isUploading ? "processing" : thumbnailStatus}
        />

        <main
          key={activeTab}
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
