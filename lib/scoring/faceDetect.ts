/**
 * faceDetect.ts
 *
 * Wraps face-api.js to detect face presence, size, and position in a thumbnail,
 * then produces a 0-100 score. Higher = well-framed, appropriately sized face.
 *
 * Scoring heuristics (common YouTube thumbnail best-practices):
 *  - Face present at all:      baseline 40 pts
 *  - Face area 5-20% of frame: up to +40 pts (sweet spot — visible but not cropped)
 *  - Face vertically centered  in upper 2/3 of frame: up to +20 pts
 *  - Multiple faces:           slight penalty (-10) — single subject tends to perform better
 */

// face-api.js is a client-side library — guard against SSR execution
let faceApiLoaded = false;

async function ensureFaceApi() {
  if (typeof window === "undefined") return null;
  if (faceApiLoaded) {
    const faceapi = await import("face-api.js");
    return faceapi;
  }

  const faceapi = await import("face-api.js");

  // Load the tiny face detector model from CDN
  // In production, these would be served from /public/models/
  const MODEL_URL =
    "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    faceApiLoaded = true;
  } catch (err) {
    console.warn("[faceDetect] Could not load face-api.js model:", err);
    return null;
  }

  return faceapi;
}

interface FaceScore {
  score: number;
  faceCount: number;
  dominantFaceArea: number; // fraction of total canvas area, 0-1
}

/**
 * Detect faces in a canvas and score the result.
 *
 * @param canvas  HTMLCanvasElement containing the thumbnail image
 * @returns       FaceScore (score 0-100)
 */
export async function scoreFacePresence(
  canvas: HTMLCanvasElement
): Promise<FaceScore> {
  const faceapi = await ensureFaceApi();

  // Graceful fallback if model fails to load
  if (!faceapi) {
    return { score: 50, faceCount: 0, dominantFaceArea: 0 };
  }

  let detections;
  try {
    detections = await faceapi.detectAllFaces(
      canvas,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
    );
  } catch {
    return { score: 50, faceCount: 0, dominantFaceArea: 0 };
  }

  const canvasArea = canvas.width * canvas.height;
  const faceCount = detections.length;

  if (faceCount === 0) {
    return { score: 0, faceCount: 0, dominantFaceArea: 0 };
  }

  // Find the largest (most prominent) face
  const largest = detections.reduce((best, det) => {
    const area = det.box.width * det.box.height;
    const bestArea = best.box.width * best.box.height;
    return area > bestArea ? det : best;
  });

  const faceArea = largest.box.width * largest.box.height;
  const faceRatio = faceArea / canvasArea;

  // --- Score components ---

  // 1. Presence (40 pts baseline)
  let score = 40;

  // 2. Size score — peaks when face is 5-20% of frame area (+40 pts max)
  const IDEAL_LOW = 0.05;
  const IDEAL_HIGH = 0.20;
  let sizeScore: number;
  if (faceRatio < IDEAL_LOW) {
    sizeScore = (faceRatio / IDEAL_LOW) * 40;
  } else if (faceRatio <= IDEAL_HIGH) {
    sizeScore = 40;
  } else {
    // Too large — face is cropped or overwhelming
    sizeScore = Math.max(0, 40 - ((faceRatio - IDEAL_HIGH) / 0.30) * 40);
  }
  score += sizeScore;

  // 3. Vertical position score (+20 pts if face centroid is in upper 2/3)
  const faceCenterY = largest.box.y + largest.box.height / 2;
  const normalizedY = faceCenterY / canvas.height;
  const positionScore = normalizedY <= 0.667 ? 20 : Math.max(0, 20 - (normalizedY - 0.667) * 60);
  score += positionScore;

  // 4. Multiple face penalty
  if (faceCount > 1) score = Math.max(0, score - 10);

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    faceCount,
    dominantFaceArea: faceRatio,
  };
}

/**
 * Load an image URL into a canvas and score it.
 * Handles CORS — images must allow cross-origin access.
 */
export async function scoreFacePresenceFromUrl(
  imageUrl: string
): Promise<FaceScore> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ score: 50, faceCount: 0, dominantFaceArea: 0 });
        return;
      }
      ctx.drawImage(img, 0, 0);
      const result = await scoreFacePresence(canvas);
      resolve(result);
    };
    img.onerror = () => {
      resolve({ score: 50, faceCount: 0, dominantFaceArea: 0 });
    };
    img.src = imageUrl;
  });
}
