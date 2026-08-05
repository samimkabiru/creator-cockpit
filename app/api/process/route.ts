/**
 * POST /api/process
 *
 * Accepts a transcript (text) or video file and kicks off a background
 * content-generation job via Gemini 2.5 Flash.
 *
 * Returns: { jobId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  createProcessJob,
  updateProcessJob,
} from "@/lib/jobStore";
import { parseTranscript } from "@/lib/transcriptService";
import { generateContentFromTranscript } from "@/lib/llmService";

export async function POST(request: NextRequest) {
  try {
    const jobId = `proc_${uuidv4().slice(0, 8)}`;
    createProcessJob(jobId);

    let rawTranscript = "";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const transcript = formData.get("transcript");
      const video = formData.get("video");

      if (typeof transcript === "string" && transcript.trim()) {
        rawTranscript = transcript;
      } else if (video instanceof File) {
        // For now: use filename as placeholder; full Whisper integration is a stretch goal
        rawTranscript = `Video uploaded: ${video.name} (${(video.size / 1024 / 1024).toFixed(1)} MB). Transcript extraction from audio is a future feature. Please paste the transcript text instead.`;
      }
    } else {
      // JSON body
      const body = await request.json().catch(() => ({}));
      if (body.transcript) {
        rawTranscript = body.transcript;
      }
    }

    if (!rawTranscript.trim()) {
      rawTranscript =
        "No transcript provided. Generate sample YouTube content metadata.";
    }

    // Return immediately, process in background
    const responsePayload = NextResponse.json({ jobId }, { status: 202 });

    // Fire-and-forget background processing
    (async () => {
      updateProcessJob(jobId, { status: "processing" });
      try {
        const cleaned = parseTranscript(rawTranscript);
        const result = await generateContentFromTranscript(cleaned);
        updateProcessJob(jobId, { status: "done", result });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Processing failed";
        updateProcessJob(jobId, { status: "error", error: message });
      }
    })();

    return responsePayload;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
