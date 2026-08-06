import { ProcessResult } from "@/types/api";

const GEMINI_MODEL = "gemini-2.5-flash";

function buildPrompt(transcript: string): string {
  const cappedTranscript = transcript.slice(0, 20000);
  
  return `You are an expert YouTube content strategist and metadata generator.
The transcript below includes [MM:SS] timestamp markers. Use these exact timestamps when creating chapter markers. Do NOT invent timestamps that don't appear in the transcript.

Generate a JSON object with the following structure based on the transcript:
{
  "chapters": [{"timestamp": "0:00", "label": "string"}], // Start at 0:00, 6-15 chapters using actual transcript timestamps
  "titles": ["string", "string", "string"], // Exactly 3 titles, under 60 chars each
  "description": "string", // SEO optimized description, 2-4 paragraphs
  "hashtags": ["#string"], // 5-8 hashtags with # prefix
  "pinnedComment": "string", // Engaging pinned comment to drive interaction
  "tweet": "string", // Promotional tweet under 280 chars
  "shorts": [{"start": "MM:SS", "end": "MM:SS", "reason": "string"}] // 2-4 candidates for shorts
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
