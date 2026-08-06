/**
 * frameExtractor.ts — Client-side video frame extraction
 *
 * Uses <video> + <canvas> to extract frames at specific timestamps
 * from a video File object. Runs entirely in the browser.
 */

/**
 * Extract frames from a video file at the given timestamps.
 *
 * @param videoFile  The video File from the upload input
 * @param timestamps Array of timestamp strings like ["0:00", "1:42", "4:15"]
 * @returns          Array of base64 JPEG data strings (without data: prefix)
 */
export async function extractFramesAtTimestamps(
  videoFile: File,
  timestamps: string[]
): Promise<string[]> {
  const url = URL.createObjectURL(videoFile);

  try {
    const frames: string[] = [];

    for (const ts of timestamps) {
      const seconds = parseTimestampToSeconds(ts);
      const base64 = await extractSingleFrame(url, seconds);
      frames.push(base64);
    }

    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Extract evenly-spaced frames from a video (useful when no timestamps are known yet).
 *
 * @param videoFile  The video File
 * @param count      Number of frames to extract (default 3)
 * @returns          Array of base64 JPEG data strings
 */
export async function extractEvenlySpacedFrames(
  videoFile: File,
  count: number = 3
): Promise<string[]> {
  const url = URL.createObjectURL(videoFile);

  try {
    const duration = await getVideoDuration(url);
    const frames: string[] = [];

    for (let i = 0; i < count; i++) {
      // Space frames evenly, avoiding the very start and end
      const fraction = (i + 1) / (count + 1);
      const seconds = Math.floor(duration * fraction);
      const base64 = await extractSingleFrame(url, seconds);
      frames.push(base64);
    }

    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractSingleFrame(videoUrl: string, timeSeconds: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "auto";

    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      video.src = "";
      video.load();
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error("Failed to get canvas 2D context"));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Export as JPEG, strip the data:image/jpeg;base64, prefix
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = dataUrl.split(",")[1];

        cleanup();
        resolve(base64);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    const onError = () => {
      cleanup();
      reject(new Error(`Failed to load video for frame extraction at ${timeSeconds}s`));
    };

    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });

    video.addEventListener(
      "loadedmetadata",
      () => {
        // Clamp seek time to valid range
        const clampedTime = Math.min(timeSeconds, Math.max(0, video.duration - 0.5));
        video.currentTime = clampedTime;
      },
      { once: true }
    );

    video.src = videoUrl;
  });
}

function getVideoDuration(videoUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.addEventListener(
      "loadedmetadata",
      () => {
        resolve(video.duration);
        video.src = "";
      },
      { once: true }
    );

    video.addEventListener(
      "error",
      () => {
        reject(new Error("Failed to load video metadata"));
        video.src = "";
      },
      { once: true }
    );

    video.src = videoUrl;
  });
}

function parseTimestampToSeconds(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) {
    // H:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // M:SS or MM:SS
    return parts[0] * 60 + parts[1];
  }
  return 0;
}
