"use client";

import { useCallback, useState } from "react";

import UploadPanel from "@/components/UploadPanel";
import TabRail, { TABS, type TabId } from "@/components/TabRail";
import StatusLight from "@/components/StatusLight";

import ChaptersTab from "@/components/tabs/ChaptersTab";
import TitlesTab from "@/components/tabs/TitlesTab";
import DescriptionTab from "@/components/tabs/DescriptionTab";
import HashtagsTab from "@/components/tabs/HashtagsTab";
import PinnedCommentTab from "@/components/tabs/PinnedCommentTab";
import TweetTab from "@/components/tabs/TweetTab";
import ThumbnailsTab from "@/components/tabs/ThumbnailsTab";
import ChecklistTab from "@/components/tabs/ChecklistTab";

import { startProcessJob, startThumbnailJob, getProcessJob, getThumbnailJob } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";

import type { ProcessJobResponse, ThumbnailJobResponse } from "@/types/api";

export default function Home() {
  // ---------------------------------------------------------------------------
  // Job IDs — set when user submits
  // ---------------------------------------------------------------------------
  const [processJobId, setProcessJobId] = useState<string | null>(null);
  const [thumbnailJobId, setThumbnailJobId] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string>("Processing…");
  const [activeTab, setActiveTab] = useState<TabId>("chapters");

  const isJobActive = !!processJobId || !!thumbnailJobId;

  // ---------------------------------------------------------------------------
  // Polling — one hook per job, independent
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
    enabled: !!processJobId,
    intervalMs: 1000,
    getStatus: (d) => d.status,
  });

  const {
    data: thumbnailResponse,
    status: thumbnailStatus,
  } = usePolling<ThumbnailJobResponse>({
    getter: thumbnailGetter,
    enabled: !!thumbnailJobId,
    intervalMs: 1000,
    getStatus: (d) => d.status,
  });

  // ---------------------------------------------------------------------------
  // Submit handler — fires both jobs in parallel
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(
    async (input: { video?: File; transcript?: string }) => {
      const label = input.video
        ? input.video.name
        : `Transcript (${(input.transcript?.length ?? 0).toLocaleString()} chars)`;
      setActiveLabel(label);

      const [processRes, thumbnailRes] = await Promise.all([
        startProcessJob(input),
        startThumbnailJob({ video: input.video }),
      ]);

      setProcessJobId(processRes.jobId);
      setThumbnailJobId(thumbnailRes.jobId);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Overall header status — worst-case of both jobs
  // ---------------------------------------------------------------------------
  const overallStatus =
    processStatus === "error" || thumbnailStatus === "error"
      ? "error"
      : processStatus === "processing" || thumbnailStatus === "processing"
      ? "processing"
      : processStatus === "done" && thumbnailStatus === "done"
      ? "done"
      : processStatus === "pending" || thumbnailStatus === "pending"
      ? "pending"
      : null;

  // ---------------------------------------------------------------------------
  // Tab content renderer
  // ---------------------------------------------------------------------------
  const result = processResponse?.result;
  const thumbResult = thumbnailResponse ?? undefined;

  function renderTab() {
    switch (activeTab) {
      case "chapters":
        return <ChaptersTab status={processStatus} chapters={result?.chapters} />;
      case "titles":
        return <TitlesTab status={processStatus} titles={result?.titles} />;
      case "description":
        return <DescriptionTab status={processStatus} description={result?.description} />;
      case "hashtags":
        return <HashtagsTab status={processStatus} hashtags={result?.hashtags} />;
      case "pinned-comment":
        return <PinnedCommentTab status={processStatus} pinnedComment={result?.pinnedComment} />;
      case "tweet":
        return <TweetTab status={processStatus} tweet={result?.tweet} />;
      case "thumbnails":
        return (
          <ThumbnailsTab
            status={thumbnailStatus}
            variants={thumbnailResponse?.variants}
          />
        );
      case "checklist":
        return (
          <ChecklistTab
            processStatus={processStatus}
            thumbnailStatus={thumbnailStatus}
            processResult={result}
            thumbnailResult={thumbResult}
          />
        );
    }
  }

  // ---------------------------------------------------------------------------
  // Landing state — UploadPanel fills the screen
  // ---------------------------------------------------------------------------
  if (!isJobActive) {
    return (
      <UploadPanel
        onSubmit={handleSubmit}
        isJobActive={false}
        activeLabel={undefined}
        activeStatus={null}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Active state — header + collapsed panel + tab rail + tab content
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
      {/* ── App header ── */}
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

        {/* Active filename */}
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

      {/* ── Collapsed upload strip ── */}
      <div style={{ flexShrink: 0 }}>
        <UploadPanel
          onSubmit={handleSubmit}
          isJobActive={true}
          activeLabel={activeLabel}
          activeStatus={overallStatus}
        />
      </div>


      {/* ── Main workspace: tab rail + content ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <TabRail
          activeTab={activeTab}
          onTabChange={setActiveTab}
          processStatus={processStatus}
          thumbnailStatus={thumbnailStatus}
        />

        {/* Tab content area */}
        <main
          key={activeTab}  /* remount + re-animate on tab change */
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
