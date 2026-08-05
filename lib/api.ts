/**
 * API barrel file.
 *
 * All components import from here — never from mock-api.ts directly.
 *
 * This version calls the real Next.js API route handlers
 * instead of the in-memory mock.
 */

import type {
  ProcessJobResponse,
  ThumbnailJobResponse,
} from "@/types/api";

const BASE = ""; // same-origin — no CORS needed

// ---------------------------------------------------------------------------
// Process jobs
// ---------------------------------------------------------------------------

export async function startProcessJob(input: {
  video?: File;
  transcript?: string;
}): Promise<{ jobId: string }> {
  const formData = new FormData();

  if (input.video) {
    formData.append("video", input.video);
  }
  if (input.transcript) {
    formData.append("transcript", input.transcript);
  }

  const res = await fetch(`${BASE}/api/process`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`POST /api/process failed: ${res.status}`);
  }

  return res.json();
}

export async function getProcessJob(
  jobId: string
): Promise<ProcessJobResponse> {
  const res = await fetch(`${BASE}/api/process/${jobId}`);

  if (!res.ok && res.status !== 404) {
    throw new Error(`GET /api/process/${jobId} failed: ${res.status}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Thumbnail jobs
// ---------------------------------------------------------------------------

export async function startThumbnailJob(input: {
  video?: File;
  images?: File[];
}): Promise<{ jobId: string }> {
  const formData = new FormData();

  if (input.video) {
    formData.append("video", input.video);
  }
  if (input.images) {
    input.images.forEach((img) => formData.append("images", img));
  }

  const res = await fetch(`${BASE}/api/thumbnails`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`POST /api/thumbnails failed: ${res.status}`);
  }

  return res.json();
}

export async function getThumbnailJob(
  jobId: string
): Promise<ThumbnailJobResponse> {
  const res = await fetch(`${BASE}/api/thumbnails/${jobId}`);

  if (!res.ok && res.status !== 404) {
    throw new Error(`GET /api/thumbnails/${jobId} failed: ${res.status}`);
  }

  return res.json();
}
