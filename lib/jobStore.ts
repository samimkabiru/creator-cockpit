/**
 * Server-side persistent job store.
 *
 * Combines in-memory global caching with file-system persistence in os.tmpdir()
 * so jobs persist seamlessly across serverless worker restarts & hot reloads.
 */

import fs from "fs";
import path from "path";
import os from "os";
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

// Ensure jobs directory exists in os.tmpdir()
const JOBS_DIR = path.join(os.tmpdir(), "creator_cockpit_jobs");
if (!fs.existsSync(JOBS_DIR)) {
  try {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
  } catch (err) {
    console.warn("Could not create JOBS_DIR:", err);
  }
}

// Global singletons for memory caching
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
// Disk Persistence Helpers
// ---------------------------------------------------------------------------

function saveJobToDisk<T>(key: string, data: T) {
  try {
    const filePath = path.join(JOBS_DIR, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to save job ${key} to disk:`, err);
  }
}

function loadJobFromDisk<T>(key: string): T | undefined {
  try {
    const filePath = path.join(JOBS_DIR, `${key}.json`);
    if (fs.existsSync(filePath)) {
      const text = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(text) as T;
    }
  } catch (err) {
    console.warn(`Failed to load job ${key} from disk:`, err);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Process Jobs
// ---------------------------------------------------------------------------

export function createProcessJob(id: string): ProcessJob {
  const job: ProcessJob = { id, status: "pending", createdAt: Date.now() };
  processJobs.set(id, job);
  saveJobToDisk(`process_${id}`, job);
  return job;
}

export function getProcessJob(id: string): ProcessJob | undefined {
  let job = processJobs.get(id);
  if (!job) {
    job = loadJobFromDisk<ProcessJob>(`process_${id}`);
    if (job) processJobs.set(id, job);
  }
  return job;
}

export function updateProcessJob(
  id: string,
  updates: Partial<Omit<ProcessJob, "id">>
) {
  const job = getProcessJob(id);
  if (job) {
    Object.assign(job, updates);
    processJobs.set(id, job);
    saveJobToDisk(`process_${id}`, job);
  }
}

// ---------------------------------------------------------------------------
// Thumbnail Jobs
// ---------------------------------------------------------------------------

export function createThumbnailJob(id: string): ThumbnailJob {
  const job: ThumbnailJob = { id, status: "pending", createdAt: Date.now() };
  thumbnailJobs.set(id, job);
  saveJobToDisk(`thumb_${id}`, job);
  return job;
}

export function getThumbnailJob(id: string): ThumbnailJob | undefined {
  let job = thumbnailJobs.get(id);
  if (!job) {
    job = loadJobFromDisk<ThumbnailJob>(`thumb_${id}`);
    if (job) thumbnailJobs.set(id, job);
  }
  return job;
}

export function updateThumbnailJob(
  id: string,
  updates: Partial<Omit<ThumbnailJob, "id">>
) {
  const job = getThumbnailJob(id);
  if (job) {
    Object.assign(job, updates);
    thumbnailJobs.set(id, job);
    saveJobToDisk(`thumb_${id}`, job);
  }
}
