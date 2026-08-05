"use client";

import StatusLight from "@/components/StatusLight";
import type { JobStatus } from "@/types/api";

export type TabId =
  | "chapters"
  | "titles"
  | "description"
  | "hashtags"
  | "pinned-comment"
  | "tweet"
  | "thumbnails"
  | "checklist";

export interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  /** Which job feeds this tab — process job, thumbnail job, or both */
  jobSource: "process" | "thumbnail" | "both";
}

interface TabRailProps {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
  processStatus: JobStatus | null;
  thumbnailStatus: JobStatus | null;
}

export const TABS: TabDef[] = [
  { id: "chapters",      label: "Chapters",       icon: <ChaptersIcon />,  jobSource: "process" },
  { id: "titles",        label: "Titles",          icon: <TitlesIcon />,    jobSource: "process" },
  { id: "description",   label: "Description",     icon: <DescIcon />,      jobSource: "process" },
  { id: "hashtags",      label: "Hashtags",        icon: <HashIcon />,      jobSource: "process" },
  { id: "pinned-comment",label: "Pinned Comment",  icon: <PinIcon />,       jobSource: "process" },
  { id: "tweet",         label: "Tweet",           icon: <TweetIcon />,     jobSource: "process" },
  { id: "thumbnails",    label: "Thumbnails",      icon: <ThumbIcon />,     jobSource: "thumbnail" },
  { id: "checklist",     label: "Checklist",       icon: <CheckIcon />,     jobSource: "both" },
];

export default function TabRail({
  activeTab,
  onTabChange,
  processStatus,
  thumbnailStatus,
}: TabRailProps) {
  function getStatus(tab: TabDef): JobStatus | null {
    if (tab.jobSource === "process") return processStatus;
    if (tab.jobSource === "thumbnail") return thumbnailStatus;
    // "both" — show the worst/most-in-progress status
    if (processStatus === "processing" || thumbnailStatus === "processing")
      return "processing";
    if (processStatus === "error" || thumbnailStatus === "error") return "error";
    if (processStatus === "done" && thumbnailStatus === "done") return "done";
    if (processStatus === "pending" || thumbnailStatus === "pending")
      return "pending";
    return null;
  }

  return (
    <nav
      aria-label="Content tabs"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "180px",
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "8px 0",
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const status = getStatus(tab);

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 14px",
              background: isActive ? "var(--surface-raised)" : "transparent",
              border: "none",
              borderLeft: isActive
                ? "2px solid var(--accent-live)"
                : "2px solid transparent",
              color: isActive ? "var(--text)" : "var(--text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: isActive ? 500 : 400,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition:
                "background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)",
            }}
          >
            {/* Icon */}
            <span
              style={{
                opacity: isActive ? 1 : 0.5,
                display: "flex",
                flexShrink: 0,
              }}
            >
              {tab.icon}
            </span>

            {/* Label */}
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tab.label}
            </span>

            {/* Status light */}
            <StatusLight status={status} size={6} />
          </button>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Tab icons — simple inline SVGs, consistent 14×14 stroke style
// ---------------------------------------------------------------------------

function ChaptersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function TitlesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16M4 12h10M4 18h6" />
    </svg>
  );
}

function DescIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TweetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
  );
}

function ThumbIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
