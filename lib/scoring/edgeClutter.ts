/**
 * edgeClutter.ts
 *
 * Run a Sobel edge-detection convolution on the region behind the text overlay.
 * Higher edge density = more visual noise = harder to read text = lower score.
 *
 * Returns 0-100 where 100 = very clean background, 0 = maximally cluttered.
 */

// 3×3 Sobel kernels
const SOBEL_X = [
  [-1,  0,  1],
  [-2,  0,  2],
  [-1,  0,  1],
];

const SOBEL_Y = [
  [-1, -2, -1],
  [ 0,  0,  0],
  [ 1,  2,  1],
];

/**
 * Convert RGBA imageData pixel at index `i` to greyscale luminance (0-255).
 */
function toLuma(data: Uint8ClampedArray, i: number): number {
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
}

/**
 * Apply Sobel edge detection to an ImageData region and return the mean
 * gradient magnitude (0-1 normalized against the theoretical max of ~1442).
 */
function sobelMeanGradient(imageData: ImageData): number {
  const { data, width, height } = imageData;

  if (width < 3 || height < 3) return 0;

  let totalGradient = 0;
  let sampleCount = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const luma = toLuma(data, idx);
          gx += SOBEL_X[ky + 1][kx + 1] * luma;
          gy += SOBEL_Y[ky + 1][kx + 1] * luma;
        }
      }

      // Gradient magnitude
      totalGradient += Math.sqrt(gx * gx + gy * gy);
      sampleCount++;
    }
  }

  if (sampleCount === 0) return 0;

  // Theoretical max gradient magnitude for 3×3 Sobel on 0-255 values ≈ 1442
  const MAX_GRADIENT = 1442;
  return totalGradient / sampleCount / MAX_GRADIENT;
}

/**
 * Score readability of the text region background.
 * Lower edge density → higher score (cleaner background = more readable text).
 *
 * @param ctx      CanvasRenderingContext2D of the thumbnail
 * @param regionX  X offset of text region
 * @param regionY  Y offset of text region
 * @param regionW  Width of text region
 * @param regionH  Height of text region
 * @returns        Score 0-100 (100 = clean, 0 = very cluttered)
 */
export function scoreEdgeClutter(
  ctx: CanvasRenderingContext2D,
  regionX: number,
  regionY: number,
  regionW: number,
  regionH: number
): number {
  if (regionW < 3 || regionH < 3) return 50; // Not enough data — neutral

  const imageData = ctx.getImageData(regionX, regionY, regionW, regionH);
  const normalizedGradient = sobelMeanGradient(imageData); // 0.0 – 1.0

  // Invert: low gradient → high score
  const score = (1 - normalizedGradient) * 100;
  return Math.round(Math.max(0, Math.min(100, score)));
}
