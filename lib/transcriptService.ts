/**
 * Transcript cleaning utility.
 *
 * Accepts raw pasted text or SRT-formatted subtitles and produces
 * a clean timestamped plain-text transcript for LLM consumption.
 */

export function parseTranscript(input: string): string {
  if (!input || !input.trim()) return "";

  // Detect SRT format: block index, timestamp arrow, subtitle text
  const srtPattern =
    /\d+\r?\n\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/;

  if (srtPattern.test(input)) {
    return input
      .split(/\r?\n\r?\n/)
      .map((block) => {
        const lines = block.trim().split(/\r?\n/);
        if (lines.length >= 3) {
          const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2})/);
          const timeStr = timeMatch ? `[${timeMatch[1]}] ` : "";
          const text = lines.slice(2).join(" ").trim();
          return `${timeStr}${text}`;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  // Plain text — return as-is after trimming
  return input.trim();
}
