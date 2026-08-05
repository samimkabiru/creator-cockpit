/**
 * textDensity.ts
 *
 * Given the bounding box of overlay text vs. total canvas area, return a 0-100
 * score that penalizes both too little text (unclear) and too much (cluttered).
 *
 * Target coverage: 15–25% of canvas area = peak score of 100.
 * Below 5% or above 40% = score approaches 0.
 * Uses a smooth tent function centered on the ideal range.
 */

/**
 * Score text density based on coverage ratio.
 *
 * @param textAreaPx    Combined pixel area of all text bounding boxes
 * @param canvasAreaPx  Total canvas pixel area (width × height)
 * @returns             Score 0-100
 */
export function scoreTextDensity(
  textAreaPx: number,
  canvasAreaPx: number
): number {
  if (canvasAreaPx <= 0) return 0;

  const coverage = textAreaPx / canvasAreaPx; // 0.0 – 1.0

  // Ideal window: 0.15 – 0.25 coverage (15–25%)
  const IDEAL_LOW = 0.15;
  const IDEAL_HIGH = 0.25;
  const DEAD_LOW = 0.02;  // below this → essentially no text
  const DEAD_HIGH = 0.50; // above this → completely cluttered

  let score: number;

  if (coverage < DEAD_LOW || coverage > DEAD_HIGH) {
    score = 0;
  } else if (coverage >= IDEAL_LOW && coverage <= IDEAL_HIGH) {
    // Perfect range
    score = 100;
  } else if (coverage < IDEAL_LOW) {
    // Ramp up from DEAD_LOW to IDEAL_LOW
    score = ((coverage - DEAD_LOW) / (IDEAL_LOW - DEAD_LOW)) * 100;
  } else {
    // Ramp down from IDEAL_HIGH to DEAD_HIGH
    score = ((DEAD_HIGH - coverage) / (DEAD_HIGH - IDEAL_HIGH)) * 100;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Convenience: compute textAreaPx from a list of bounding boxes.
 *
 * @param boxes  Array of {width, height} objects in pixels
 * @param canvasW Canvas width in pixels
 * @param canvasH Canvas height in pixels
 * @returns      Score 0-100
 */
export function scoreTextDensityFromBoxes(
  boxes: Array<{ width: number; height: number }>,
  canvasW: number,
  canvasH: number
): number {
  const textArea = boxes.reduce((sum, b) => sum + b.width * b.height, 0);
  return scoreTextDensity(textArea, canvasW * canvasH);
}
