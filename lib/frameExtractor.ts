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
      if (base64) frames.push(base64);
    }

    // Fallback if no frames extracted
    if (frames.length === 0) {
      return extractEvenlySpacedFrames(videoFile, 3);
    }

    return frames;
  } catch (err) {
    console.warn("extractFramesAtTimestamps error:", err);
    return extractEvenlySpacedFrames(videoFile, 3);
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
      const seconds = Math.max(0.5, Math.floor(duration * fraction));
      const base64 = await extractSingleFrame(url, seconds);
      if (base64) frames.push(base64);
    }

    return frames;
  } catch (err) {
    console.warn("extractEvenlySpacedFrames error:", err);
    return [];
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractSingleFrame(videoUrl: string, timeSeconds: number): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "auto";

    let isCleanedUp = false;

    // Safety timeout: 4 seconds max per frame
    const timeoutId = setTimeout(() => {
      if (!isCleanedUp) {
        console.warn(`Frame extraction timeout at ${timeSeconds}s — attempting draw anyway`);
        drawAndResolve();
      }
    }, 4000);

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      clearTimeout(timeoutId);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      video.src = "";
      video.load();
    };

    const drawAndResolve = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          resolve("");
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Export as JPEG, strip data:image/jpeg;base64, prefix
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = dataUrl.split(",")[1] || "";

        cleanup();
        resolve(base64);
      } catch (err) {
        console.warn("Failed canvas frame draw:", err);
        cleanup();
        resolve("");
      }
    };

    const onSeeked = () => {
      drawAndResolve();
    };

    const onError = () => {
      console.warn(`Error loading video frame at ${timeSeconds}s`);
      cleanup();
      resolve("");
    };

    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });

    video.addEventListener(
      "loadedmetadata",
      () => {
        // Force time to be at least 0.2s so setting currentTime always triggers seeked event
        const clampedTime = Math.max(0.2, Math.min(timeSeconds, video.duration - 0.5));
        video.currentTime = clampedTime;
      },
      { once: true }
    );

    video.src = videoUrl;
  });
}

function getVideoDuration(videoUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    const timeoutId = setTimeout(() => {
      video.src = "";
      resolve(10); // fallback duration
    }, 3000);

    video.addEventListener(
      "loadedmetadata",
      () => {
        clearTimeout(timeoutId);
        resolve(video.duration || 10);
        video.src = "";
      },
      { once: true }
    );

    video.addEventListener(
      "error",
      () => {
        clearTimeout(timeoutId);
        resolve(10);
        video.src = "";
      },
      { once: true }
    );

    video.src = videoUrl;
  });
}

function parseTimestampToSeconds(ts: string): number {
  if (!ts) return 0;
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  } else if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  return 0;
}
