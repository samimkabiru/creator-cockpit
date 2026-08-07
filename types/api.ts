export type JobStatus = "pending" | "processing" | "done" | "error";

export interface Chapter {
  timestamp: string; // "MM:SS" or "HH:MM:SS"
  label: string;
}

export interface ShortCandidate {
  start: string;
  end: string;
  reason: string;
}

export interface ChecklistItem {
  item: string;
  status: "ok" | "warning" | "missing";
}

export interface ProcessResult {
  chapters: Chapter[];
  titles: string[]; // exactly 3
  description: string;
  hashtags: string[]; // 5-8
  pinnedComment: string;
  tweet: string;
  shorts: ShortCandidate[];
  checklist?: ChecklistItem[];
}

export interface ProcessJobResponse {
  status: JobStatus;
  result?: ProcessResult;
  error?: string;
}

export interface ThumbnailBreakdown {
  contrast: number;     // 0-100
  textDensity: number;  // 0-100
  edgeClutter: number;  // 0-100 (Visual Simplicity)
}

export interface ThumbnailVariant {
  id: string;
  imageUrl: string;
  compositeScore: number; // 0-100
  breakdown: ThumbnailBreakdown;
}

export interface ThumbnailJobResponse {
  status: JobStatus;
  variants?: ThumbnailVariant[];
  error?: string;
}
