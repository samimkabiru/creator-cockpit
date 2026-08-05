/**
 * Server-side in-memory job store.
 *
 * Tracks process and thumbnail jobs with status transitions:
 * pending → processing → done | error
 *
 * NOTE: This runs ONLY on the server (Next.js API routes).
 */

import type {
  JobStatus,
  ProcessResult,
  ThumbnailVariant,
} from "@/types/api";

export interface ProcessJob {
  id: string;
  status: JobStatus;
  result?: ProcessResult;
  error?: string;
  createdAt: number;
}

export interface ThumbnailJob {
  id: string;
  status: JobStatus;
  variants?: ThumbnailVariant[];
  error?: string;
  createdAt: number;
}

// Global singletons (persist across hot reloads in dev via globalThis)
const globalForJobs = globalThis as unknown as {
  __processJobs?: Map<string, ProcessJob>;
  __thumbnailJobs?: Map<string, ThumbnailJob>;
};

if (!globalForJobs.__processJobs) {
  globalForJobs.__processJobs = new Map();
}
if (!globalForJobs.__thumbnailJobs) {
  globalForJobs.__thumbnailJobs = new Map();
}

const processJobs = globalForJobs.__processJobs;
const thumbnailJobs = globalForJobs.__thumbnailJobs;

// ---------------------------------------------------------------------------
// Process jobs
// ---------------------------------------------------------------------------

export function createProcessJob(id: string): ProcessJob {
  const job: ProcessJob = { id, status: "pending", createdAt: Date.now() };
  processJobs.set(id, job);
  return job;
}

export function getProcessJob(id: string): ProcessJob | undefined {
  return processJobs.get(id);
}

export function updateProcessJob(
  id: string,
  updates: Partial<Omit<ProcessJob, "id">>
) {
  const job = processJobs.get(id);
  if (job) Object.assign(job, updates);
}

// ---------------------------------------------------------------------------
// Thumbnail jobs
// ---------------------------------------------------------------------------

export function createThumbnailJob(id: string): ThumbnailJob {
  const job: ThumbnailJob = { id, status: "pending", createdAt: Date.now() };
  thumbnailJobs.set(id, job);
  return job;
}

export function getThumbnailJob(id: string): ThumbnailJob | undefined {
  return thumbnailJobs.get(id);
}

export function updateThumbnailJob(
  id: string,
  updates: Partial<Omit<ThumbnailJob, "id">>
) {
  const job = thumbnailJobs.get(id);
  if (job) Object.assign(job, updates);
}
