/**
 * assemblyService.ts — Transcribes video files by extracting their audio track via ffmpeg-static
 * and sending the lightweight audio file to AssemblyAI.
 *
 * Uses low-memory streaming (stream to disk) to prevent Out-Of-Memory (OOM) crashes
 * on memory-constrained environments like Render Free (512MB RAM).
 */

import https from "https";
import fs from "fs";
import path from "path";
import os from "os";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

// Resolve absolute path to ffmpeg binary on disk to prevent Next.js webpack ENOENT error
function getFfmpegPath(): string {
  if (typeof ffmpegPath === "string" && fs.existsSync(ffmpegPath)) {
    return ffmpegPath;
  }
  const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const projectPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName);
  if (fs.existsSync(projectPath)) {
    return projectPath;
  }
  return ffmpegPath || "ffmpeg";
}

const resolvedFfmpegPath = getFfmpegPath();
if (resolvedFfmpegPath) {
  ffmpeg.setFfmpegPath(resolvedFfmpegPath);
  console.log("FFmpeg binary path resolved:", resolvedFfmpegPath);
}

interface AssemblyAITranscriptResponse {
  id?: string;
  status?: string;
  error?: string;
  text?: string;
  audio_duration?: number;
  words?: Array<{ text: string; start: number; end: number; confidence: number }>;
}

export async function transcribeVideo(videoInput: File | Buffer): Promise<{
  timestampedTranscript: string;
  rawText: string;
  durationSeconds: number;
}> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error("ASSEMBLYAI_API_KEY is not set in environment variables.");
  }

  const tempId = Math.random().toString(36).substring(2, 9);
  const tempDir = os.tmpdir();
  const inputVideoPath = path.join(tempDir, `input_${tempId}.mp4`);
  const outputAudioPath = path.join(tempDir, `audio_${tempId}.mp3`);

  try {
    // 1. Write incoming video stream directly to temp disk file (low RAM overhead)
    if (Buffer.isBuffer(videoInput)) {
      console.log(`Writing ${(videoInput.length / 1024 / 1024).toFixed(1)} MB video buffer to disk...`);
      fs.writeFileSync(inputVideoPath, videoInput);
    } else {
      console.log(`Streaming ${(videoInput.size / 1024 / 1024).toFixed(1)} MB video File directly to disk...`);
      const nodeStream = Readable.fromWeb(videoInput.stream() as unknown as import("stream/web").ReadableStream);
      const writeStream = fs.createWriteStream(inputVideoPath);
      await pipeline(nodeStream, writeStream);
    }

    // 2. Extract audio track to MP3 using ffmpeg-static
    console.log("Extracting audio track from video file via ffmpeg...");
    await extractAudioFromVideo(inputVideoPath, outputAudioPath);

    // Immediately remove raw video file to free disk/RAM
    try {
      if (fs.existsSync(inputVideoPath)) fs.unlinkSync(inputVideoPath);
    } catch {
      // ignore
    }

    const audioBuffer = fs.readFileSync(outputAudioPath);
    console.log(`Audio extraction complete! MP3 size: ${(audioBuffer.length / 1024 / 1024).toFixed(1)} MB`);

    // 3. Upload raw audio buffer to AssemblyAI
    console.log("Uploading MP3 audio buffer to AssemblyAI...");
    const uploadUrl = await uploadBufferToAssemblyAI(audioBuffer, apiKey);
    console.log("AssemblyAI upload complete! Upload URL:", uploadUrl);

    // 4. Submit transcription job
    console.log("Submitting AssemblyAI transcription job...");
    const transcriptId = await submitTranscriptJob(uploadUrl, apiKey);
    console.log(`Transcription started: ${transcriptId}`);

    // 5. Poll until completed
    const finalData = await pollTranscriptJob(transcriptId, apiKey);
    console.log(`AssemblyAI transcription completed! Duration: ${finalData.audio_duration || 0}s`);

    // 6. Format words into 60-second [MM:SS] timestamp buckets for LLM
    const words = finalData.words || [];
    let timestampedTranscript = "";
    let currentBucket = -1;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const bucket = Math.floor(word.start / 60000); // 60-second intervals (1 minute)

      if (bucket > currentBucket) {
        currentBucket = bucket;
        const totalSeconds = currentBucket * 60;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeStr = `[${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}]`;

        if (timestampedTranscript.length > 0) {
          timestampedTranscript += "\n";
        }
        timestampedTranscript += timeStr + " " + word.text;
      } else {
        timestampedTranscript += " " + word.text;
      }
    }

    return {
      timestampedTranscript,
      rawText: finalData.text || "",
      durationSeconds: finalData.audio_duration || 0,
    };
  } finally {
    // Cleanup temporary files safely
    try {
      if (fs.existsSync(inputVideoPath)) fs.unlinkSync(inputVideoPath);
      if (fs.existsSync(outputAudioPath)) fs.unlinkSync(outputAudioPath);
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractAudioFromVideo(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(new Error(`FFmpeg audio extraction failed: ${err.message}`)))
      .run();
  });
}

function uploadBufferToAssemblyAI(fileBuffer: Buffer, apiKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      "https://api.assemblyai.com/v2/upload",
      {
        method: "POST",
        headers: {
          authorization: apiKey,
          "content-type": "application/octet-stream",
          "content-length": fileBuffer.length,
        },
        timeout: 0,
      },
      (res) => {
        let responseText = "";
        res.on("data", (chunk) => {
          responseText += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(responseText);
              if (json.upload_url) {
                resolve(json.upload_url);
              } else {
                reject(new Error("AssemblyAI upload succeeded but no upload_url returned: " + responseText));
              }
            } catch {
              reject(new Error("Invalid JSON from AssemblyAI upload: " + responseText));
            }
          } else {
            reject(new Error(`AssemblyAI upload failed HTTP ${res.statusCode}: ${responseText}`));
          }
        });
      }
    );

    req.on("error", (err) => {
      reject(new Error(`Network error during AssemblyAI upload: ${err.message}`));
    });

    req.write(fileBuffer);
    req.end();
  });
}

function submitTranscriptJob(audioUrl: string, apiKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ audio_url: audioUrl });
    const req = https.request(
      "https://api.assemblyai.com/v2/transcript",
      {
        method: "POST",
        headers: {
          authorization: apiKey,
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let responseText = "";
        res.on("data", (chunk) => {
          responseText += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(responseText);
              if (json.id) {
                resolve(json.id);
              } else {
                reject(new Error("No transcript ID returned: " + responseText));
              }
            } catch {
              reject(new Error("Invalid JSON from AssemblyAI transcript submit: " + responseText));
            }
          } else {
            reject(new Error(`AssemblyAI transcript submit failed HTTP ${res.statusCode}: ${responseText}`));
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

async function pollTranscriptJob(transcriptId: string, apiKey: string): Promise<AssemblyAITranscriptResponse> {
  while (true) {
    const data = await getTranscriptStatus(transcriptId, apiKey);
    console.log(`Polling AssemblyAI transcript status: ${data.status}`);

    if (data.status === "completed") {
      return data;
    }
    if (data.status === "error") {
      throw new Error(`AssemblyAI transcription failed: ${data.error}`);
    }

    await new Promise((r) => setTimeout(r, 3000));
  }
}

function getTranscriptStatus(transcriptId: string, apiKey: string): Promise<AssemblyAITranscriptResponse> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        method: "GET",
        headers: {
          authorization: apiKey,
        },
      },
      (res) => {
        let responseText = "";
        res.on("data", (chunk) => {
          responseText += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(responseText);
              resolve(json);
            } catch {
              reject(new Error("Invalid JSON polling transcript status: " + responseText));
            }
          } else {
            reject(new Error(`AssemblyAI polling failed HTTP ${res.statusCode}: ${responseText}`));
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.end();
  });
}
