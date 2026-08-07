import { ProcessResult } from "@/types/api";

const GEMINI_MODEL = "gemini-2.5-flash";

function buildPrompt(transcript: string): string {
  const cappedTranscript = transcript.slice(0, 20000);
  
  return `You are an expert YouTube content strategist and metadata generator.
The transcript below includes [MM:SS] timestamp markers. Use these exact timestamps when creating chapter markers. Do NOT invent timestamps that don't appear in the transcript.

CHAPTER DETECTION METHOD (do this before writing any chapter):
Read the transcript as a sequence of content segments, not a stream of sentences. A new segment begins only when one of these signals is present:
- Explicit verbal signposting: the speaker signals a shift ("now let's talk about," "next up," "moving on to," "so now that we've covered X," "let's switch to").
- Topic/subject change: the dominant noun, concept, or entity being discussed changes and does not return to the prior one.
- Activity change: the speaker moves from one mode to another (explaining -> demonstrating -> troubleshooting -> concluding; or question -> answer -> next question in interview/Q&A format).
- Narrative beat change: a new location, example, product, or event is introduced (for vlogs, reviews, stories).

Do NOT treat these as new segments:
- A pause, tangent, or joke that returns to the same topic.
- Restating or summarizing something already covered.
- A change in tone or energy without a change in subject.

For each segment boundary you identify, select the transcript's timestamp marker attached to the FIRST sentence where the new segment actually begins, not the sentence before it trails off and not a rounded/nearby marker.

CHAPTER COUNT: Do not target a fixed number. Let the count match how many genuine segments you found.
- Minimum 3 chapters (YouTube will not activate chapters below this). If the transcript genuinely has fewer than 3 topic shifts, split the largest segment at its most defensible internal transition rather than inventing a fake one.
- Typical range is 4-10 for a 10-20 minute video, fewer for shorter videos, more only if there are genuinely that many distinct segments. Do not pad to hit a round number.
- Each chapter must span at least 10 seconds of content. Never create back-to-back chapters closer than that.
- The first chapter must be exactly "0:00".
- Timestamps must be strictly ascending.

LABEL RULES:
- 3-6 words, front-load the concrete noun or action (what happens here), not a vague description.
- Avoid: "Intro," "Continuation," "More on this," "Part 2," "Chapter 1," or restating the video title.
- Write it as a viewer would search for that moment, not as a transcript summary.

SHORTS CANDIDATE SELECTION RULES:
- Identify 2 to 4 distinct segments from the transcript that are ideal for viral YouTube Shorts, TikToks, or Instagram Reels.
- Duration: Each short candidate MUST be under 60 seconds (ideally 30–55 seconds). Calculate difference between end and start timestamps.
- Content: Focus on high-energy hooks, dramatic reveals, key step-by-step demonstrations, or emotional payoffs that are self-contained.
- Start and End timestamps MUST be exact [MM:SS] markers present in the transcript.

Generate a JSON object with the following structure based on the transcript:
{
  "chapters": [{"timestamp": "0:00", "label": "string"}], // Apply the CHAPTER DETECTION METHOD above. Do not space chapters evenly or by fixed intervals.
  "titles": ["string", "string", "string"], // Exactly 3 titles, under 60 chars each
  "description": "string", // SEO optimized description, 2-4 paragraphs
  "hashtags": ["#string"], // 5-8 hashtags with # prefix
  "pinnedComment": "string", // Engaging pinned comment to drive interaction
  "tweet": "string", // Promotional tweet under 280 chars
  "shorts": [{"start": "MM:SS", "end": "MM:SS", "reason": "string"}], // 2-4 candidates under 60 seconds matching SHORTS CANDIDATE SELECTION RULES
  "checklist": [{"item": "string", "status": "ok"}] // 6-10 publication quality check items
}

Transcript:
${cappedTranscript}
`;
}

export async function generateContentFromTranscript(
  transcriptText: string
): Promise<ProcessResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from environment variables");
  }

  const prompt = buildPrompt(transcriptText);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API request failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textResponse) {
    throw new Error("Invalid response structure from Gemini API: missing text content");
  }

  let cleanText = textResponse;
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.substring(3);
  }
  
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  
  cleanText = cleanText.trim();

  return JSON.parse(cleanText) as ProcessResult;
}
