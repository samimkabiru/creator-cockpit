/**
 * API barrel file.
 *
 * All components import from here — never from mock-api.ts directly.
 *
 * This version calls the real Next.js API route handlers
 * with upload progress tracking via XMLHttpRequest.
 */

import type {
  ProcessJobResponse,
  ThumbnailJobResponse,
} from "@/types/api";

const BASE = ""; // same-origin — no CORS needed

// ---------------------------------------------------------------------------
// Process jobs
// ---------------------------------------------------------------------------

export async function startProcessJob(
  input: { video?: File; transcript?: string },
  onProgress?: (percent: number) => void
): Promise<{ jobId: string }> {
  const formData = new FormData();

  if (input.video) {
    formData.append("video", input.video);
  }
  if (input.transcript) {
    formData.append("transcript", input.transcript);
  }

  // Use XMLHttpRequest for upload progress when a video file is present
  if (input.video && onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Invalid JSON response from /api/process"));
          }
        } else {
          reject(new Error(`POST /api/process failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.open("POST", `${BASE}/api/process`);
      xhr.send(formData);
    });
  }

  // Standard fetch for transcript-only submissions
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

// ---------------------------------------------------------------------------
// AI Thumbnail Generation (called after process job completes)
// ---------------------------------------------------------------------------

export async function generateAIThumbnails(input: {
  titles: string[];
  description: string;
  frames: string[]; // base64 JPEG strings
}): Promise<{ jobId: string }> {
  const res = await fetch(`${BASE}/api/thumbnails/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`POST /api/thumbnails/generate failed: ${res.status}`);
  }

  return res.json();
}
