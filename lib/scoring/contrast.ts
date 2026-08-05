/**
 * contrast.ts
 *
 * Given a canvas region (where overlay text sits), compute the WCAG relative
 * luminance contrast ratio between the text color and the average background
 * color of that region. Returns a 0-100 normalized score.
 *
 * WCAG contrast ratio range: 1:1 (no contrast) to 21:1 (black on white).
 * We normalize so that ratio ≥ 4.5 (WCAG AA) maps to ≥ 75/100.
 */

/**
 * Compute relative luminance of an sRGB color per WCAG 2.1.
 * @param r Red channel 0-255
 * @param g Green channel 0-255
 * @param b Blue channel 0-255
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Sample pixel data from a canvas region and return the average RGB.
 */
function averageRegionColor(
  imageData: ImageData
): { r: number; g: number; b: number } {
  const { data, width, height } = imageData;
  let rSum = 0,
    gSum = 0,
    bSum = 0;
  const pixelCount = width * height;

  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }

  return {
    r: rSum / pixelCount,
    g: gSum / pixelCount,
    b: bSum / pixelCount,
  };
}

/**
 * Score contrast between overlay text and the canvas region behind it.
 *
 * @param ctx         CanvasRenderingContext2D of the thumbnail
 * @param regionX     X offset of the text overlay region (px)
 * @param regionY     Y offset of the text overlay region (px)
 * @param regionW     Width of the text overlay region (px)
 * @param regionH     Height of the text overlay region (px)
 * @param textColor   Text color as {r,g,b} 0-255 (default: white)
 * @returns           Score 0-100
 */
export function scoreContrast(
  ctx: CanvasRenderingContext2D,
  regionX: number,
  regionY: number,
  regionW: number,
  regionH: number,
  textColor: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 }
): number {
  if (regionW <= 0 || regionH <= 0) return 0;

  const imageData = ctx.getImageData(regionX, regionY, regionW, regionH);
  const bg = averageRegionColor(imageData);

  const bgLum = relativeLuminance(bg.r, bg.g, bg.b);
  const fgLum = relativeLuminance(textColor.r, textColor.g, textColor.b);

  const lighter = Math.max(bgLum, fgLum);
  const darker = Math.min(bgLum, fgLum);
  const ratio = (lighter + 0.05) / (darker + 0.05); // 1–21

  // Normalize: ratio 1 → 0, ratio 21 → 100
  // Extra weight given to AA threshold (4.5) and AAA (7.0)
  const normalized = Math.min(100, ((ratio - 1) / 20) * 100);
  return Math.round(normalized);
}
