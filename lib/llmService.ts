/**
 * LLM Service — Gemini 2.5 Flash structured output engine.
 *
 * Takes a cleaned transcript and returns the full ProcessResult
 * as a single structured JSON response from Gemini.
 *
 * Server-side only (uses process.env.GEMINI_API_KEY).
 */

import type { ProcessResult } from "@/types/api";

const GEMINI_MODEL = "gemini-2.5-flash";

export async function generateContentFromTranscript(
  transcriptText: string
): Promise<ProcessResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn(
      "⚠️  GEMINI_API_KEY is not set — returning fallback result for development."
    );
    return generateFallbackResult(transcriptText);
  }

  const prompt = buildPrompt(transcriptText);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText: string | undefined =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("No text content returned from Gemini model.");
    }

    // Strip markdown fences if Gemini wraps the JSON
    const cleaned = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const result: ProcessResult = JSON.parse(cleaned);
    return result;
  } catch (error) {
    console.error("Failed to generate content via Gemini API:", error);
    return generateFallbackResult(transcriptText);
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(transcript: string): string {
  // Cap transcript to avoid exceeding context window
  const trimmed = transcript.slice(0, 20_000);

  return `You are an expert YouTube content strategist. Analyze the following video transcript and produce a structured JSON object with ALL of the fields described below.

TRANSCRIPT:
${trimmed}

REQUIRED JSON (return ONLY valid JSON, no markdown fences, no commentary):
{
  "chapters": [
    { "timestamp": "M:SS" or "MM:SS" or "H:MM:SS", "label": "Chapter title" }
  ],
  "titles": [
    "Catchy YouTube Title 1 (under 60 chars)",
    "Engaging YouTube Title 2 (under 60 chars)",
    "High-CTR YouTube Title 3 (under 60 chars)"
  ],
  "description": "Comprehensive, SEO-optimized YouTube description (2-4 paragraphs). Include gear/links section and chapter timestamps.",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4", "#Tag5", "#Tag6", "#Tag7"],
  "pinnedComment": "Engaging pinned comment with chapter links and a question to boost engagement.",
  "tweet": "Catchy promotional X/Twitter tweet under 280 characters promoting the video.",
  "shorts": [
    {
      "start": "MM:SS",
      "end": "MM:SS",
      "reason": "Why this segment works as a standalone short (under 60 seconds)."
    }
  ],
  "checklist": [
    { "item": "Check item description", "status": "ok" | "warning" | "missing" }
  ]
}

RULES:
- "chapters" array MUST start at 0:00. Include 6-15 chapters.
- "titles" array MUST have exactly 3 options, each under 60 characters.
- "hashtags" array: 5-8 relevant hashtags with # prefix.
- "shorts" array: 2-4 candidates, each under 60 seconds duration.
- "checklist" array: 8-12 items covering title, description, hashtags, chapters, pinned comment, tweet, shorts, thumbnail, end screen, and cards.
- "tweet" must be under 280 characters.`;
}

// ---------------------------------------------------------------------------
// Fallback result (when API key is missing or call fails)
// ---------------------------------------------------------------------------

function generateFallbackResult(transcriptText: string): ProcessResult {
  const snippet =
    transcriptText.slice(0, 80).replace(/\n/g, " ").trim() ||
    "Sample Video Content";

  return {
    chapters: [
      { timestamp: "0:00", label: "Intro — First impressions" },
      { timestamp: "1:42", label: "Core concept explained" },
      { timestamp: "4:15", label: "Deep-dive & examples" },
      { timestamp: "7:30", label: "Practical walkthrough" },
      { timestamp: "10:05", label: "Results & comparison" },
      { timestamp: "13:22", label: "Key takeaways" },
      { timestamp: "16:00", label: "Final verdict & next steps" },
    ],
    titles: [
      `${snippet.slice(0, 35)} — The Complete Guide`,
      `I Tested ${snippet.slice(0, 25)} So You Don't Have To`,
      `${snippet.slice(0, 30)}: Worth It in 2026?`,
    ],
    description: `In this video, we cover everything you need to know about ${snippet}.\n\nWe walk through the setup process, real-world performance, and give you our honest verdict after extensive testing.\n\n📱 Links & gear mentioned in this video:\n— [Product link]\n— [Gear used]\n\n🔔 Subscribe for more in-depth tech reviews!`,
    hashtags: [
      "#TechReview",
      "#YouTube",
      "#ContentCreator",
      "#Productivity",
      "#2026",
      "#Review",
      "#HonestReview",
    ],
    pinnedComment: `📌 CHAPTERS & QUICK LINKS\n\n0:00 Intro\n1:42 Core concept\n4:15 Deep-dive\n7:30 Walkthrough\n10:05 Results\n13:22 Key takeaways\n16:00 Verdict\n\nWhat was your biggest takeaway? Drop it below — I read every comment for the first 48 hours. 👇`,
    tweet: `New video: I spent a week testing this so you don't have to.\n\nHere's the honest truth — the good, the bad, and the surprising.\n\nFull review (timestamped) → [link]`,
    shorts: [
      {
        start: "1:42",
        end: "2:30",
        reason:
          "Strong hook explaining the core problem — grabs attention in the first 5 seconds",
      },
      {
        start: "10:05",
        end: "10:55",
        reason:
          "Dramatic result reveal with visual comparison — high shareability",
      },
      {
        start: "13:22",
        end: "14:10",
        reason:
          "Concise key takeaway summary — self-contained value in under 50 seconds",
      },
    ],
    checklist: [
      { item: "Title — 3 variants written", status: "ok" },
      { item: "Description — written with chapters & links", status: "ok" },
      { item: "Hashtags — 5-8 relevant tags", status: "ok" },
      { item: "Chapters — timestamped and labeled", status: "ok" },
      { item: "Pinned comment — ready to paste", status: "ok" },
      { item: "Tweet — written and under 280 chars", status: "ok" },
      { item: "Shorts candidates — identified", status: "ok" },
      { item: "Thumbnail — reviewed and scored", status: "warning" },
      { item: "End screen — configured in YouTube Studio", status: "missing" },
      { item: "Cards — added at relevant timestamps", status: "missing" },
    ],
  };
}
