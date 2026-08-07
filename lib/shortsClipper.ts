/**
 * shortsClipper.ts
 *
 * Client-side video clipper and 9:16 vertical center-crop renderer.
 * Converts timestamped sections of a video file into downloadable Shorts clips
 * directly in the browser using HTML5 Video, Canvas, and MediaRecorder.
 */

export function parseTimestampToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  const parts = timestamp.trim().split(":").map(Number);
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 0;
}

export function formatSecondsToTimestamp(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export async function renderAndDownloadShort(
  videoFile: File,
  startTs: string,
  endTs: string,
  filenamePrefix: string = "short_clip",
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const startSec = parseTimestampToSeconds(startTs);
  const endSec = parseTimestampToSeconds(endTs);
  const clipDuration = Math.max(1, endSec - startSec);

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoFile);
    video.crossOrigin = "anonymous";
    video.muted = false;

    video.onloadedmetadata = () => {
      try {
        const canvas = document.createElement("canvas");
        // Target 9:16 vertical resolution (1080 x 1920)
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not create 2D canvas context");
        }

        // WebAudio + MediaRecorder setup
        // @ts-expect-error - captureStream may not be present in standard HTMLVideoElement types
        const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream ? video.mozCaptureStream() : null;
        
        const canvasStream = canvas.captureStream(30); // 30 FPS
        const combinedStream = new MediaStream();

        // Add video track from canvas
        canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));

        // Add audio track from video stream if available
        if (stream) {
          stream.getAudioTracks().forEach((track: MediaStreamTrack) => combinedStream.addTrack(track));
        }

        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : MediaRecorder.isTypeSupported("video/mp4")
          ? "video/mp4"
          : "";

        const recorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : undefined);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          URL.revokeObjectURL(video.src);
          const finalBlob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
          
          // Trigger browser file download
          const downloadUrl = URL.createObjectURL(finalBlob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          const ext = recorder.mimeType.includes("mp4") ? "mp4" : "webm";
          const safeName = filenamePrefix.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30);
          a.download = `${safeName}_${startTs.replace(":", "")}-${endTs.replace(":", "")}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

          resolve(finalBlob);
        };

        // Render loop
        let animationFrameId: number;

        const drawFrame = () => {
          if (video.currentTime >= endSec || video.ended) {
            cancelAnimationFrame(animationFrameId);
            video.pause();
            if (recorder.state === "recording") {
              recorder.stop();
            }
            return;
          }

          // Calculate 9:16 center crop coordinates
          const vw = video.videoWidth || 1280;
          const vh = video.videoHeight || 720;
          
          // Crop width to match 9:16 ratio of video height
          const cropW = Math.min(vw, vh * (9 / 16));
          const cropH = vh;
          const cropX = (vw - cropW) / 2;
          const cropY = 0;

          // Draw cropped frame centered on canvas
          ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

          // Progress calculation
          const currentProgress = Math.min(99, Math.round(((video.currentTime - startSec) / clipDuration) * 100));
          if (onProgress) onProgress(currentProgress);

          animationFrameId = requestAnimationFrame(drawFrame);
        };

        // Seek video to start timestamp and play
        video.currentTime = startSec;

        video.onseeked = () => {
          recorder.start();
          video.play().catch((err) => reject(new Error("Video play failed: " + err.message)));
          drawFrame();
        };
      } catch (err: unknown) {
        URL.revokeObjectURL(video.src);
        const msg = err instanceof Error ? err.message : String(err);
        reject(new Error("Short clip rendering failed: " + msg));
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video file for clipping"));
    };
  });
}
