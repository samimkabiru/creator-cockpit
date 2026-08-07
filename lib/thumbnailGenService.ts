/**
 * thumbnailGenService.ts — Generates clean, high-impact YouTube thumbnails using Qwen (wan2.7-image-pro).
 *
 * Receives 3-4 extracted video frames for visual context per call.
 * Processes each title ONE AT A TIME (sequentially) so Qwen can inspect all frames
 * and select the best frame/composition for each title thumbnail.
 */

import fs from "fs";
import path from "path";

const QWEN_MODEL = "wan2.7-image-pro";

export async function generateSingleThumbnail(
  framesBase64: string[], // 2-4 reference video frames
  title: string,
  description: string
): Promise<Buffer> {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;

  if (!apiKey) {
    throw new Error(
      "DASHSCOPE_API_KEY (or QWEN_API_KEY) is not set in .env.local. Please add your DashScope API key."
    );
  }

  // Multi-frame prompt — instructs Qwen to choose the best frame/composition among the 2-4 frames
  const promptText = `A clean, minimal, high-impact 16:9 YouTube thumbnail image.
Examine the provided ${framesBase64.length} video frame references showing scenes, creator expressions, and key moments from this video.
Choose the best visual frame/subject composition among these images to create the thumbnail for the title below.

Video Title Focus: "${title}"
Description Context: ${description.slice(0, 250)}

Design Style Requirements:
- Simple, bold composition with strong visual hierarchy and clarity
- High contrast lighting, vibrant yet natural color palette
- Uncluttered background with soft subtle depth of field
- Modern cinematic photography feel — NOT crowded, NOT overly busy, NO noisy graphic elements
- Professional 16:9 YouTube thumbnail style`;

  console.log(`Generating Qwen (${QWEN_MODEL}) thumbnail for title: "${title}" using ${framesBase64.length} reference frames...`);

  const endpoints = [
    "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
  ];

  // Include all 2-4 video frames as images in the multimodal content array
  const contentItems: Array<{ text?: string; image?: string }> = [];
  for (const f of framesBase64) {
    if (f) {
      const formattedImage = f.startsWith("data:") ? f : `data:image/jpeg;base64,${f}`;
      contentItems.push({ image: formattedImage });
    }
  }
  contentItems.push({ text: promptText });

  const requestBody = {
    model: QWEN_MODEL,
    input: {
      messages: [
        {
          role: "user",
          content: contentItems,
        },
      ],
    },
    parameters: {
      n: 1,
      size: "2K",
    },
  };

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DashScope API error (${response.status}): ${errText}`);
      }

      const data = await response.json();

      const results = data.output?.results || data.output?.choices?.[0]?.message?.content;
      let imageUrl: string | null = null;
      let b64Json: string | null = null;

      if (Array.isArray(results)) {
        for (const item of results) {
          if (typeof item === "object") {
            if (item.url) imageUrl = item.url;
            if (item.image) imageUrl = item.image;
            if (item.b64_json) b64Json = item.b64_json;
          }
        }
      } else if (data.output?.task_id) {
        imageUrl = await pollDashScopeTask(data.output.task_id, apiKey);
      }

      if (b64Json) {
        return Buffer.from(b64Json, "base64");
      }

      if (imageUrl) {
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) {
          throw new Error(`Failed to download generated thumbnail from ${imageUrl}`);
        }
        return Buffer.from(await imgRes.arrayBuffer());
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`DashScope endpoint ${endpoint} failed:`, lastError.message);
    }
  }

  throw lastError || new Error("Failed to generate thumbnail via Qwen wan2.7-image-pro model.");
}

/**
 * Generates 3 thumbnails ONE AT A TIME (sequentially).
 */
export async function generateAndSaveThumbnails(
  frames: string[],
  titles: string[],
  description: string,
  jobId: string
): Promise<Array<{ id: string; imageUrl: string }>> {
  const publicDir = path.join(process.cwd(), "public", "uploads", "thumbs", jobId);
  fs.mkdirSync(publicDir, { recursive: true });

  const results: Array<{ id: string; imageUrl: string }> = [];
  const count = Math.min(titles.length, 3);

  // Process ONE AT A TIME sequentially
  for (let i = 0; i < count; i++) {
    const title = titles[i];

    console.log(`[Sequential ${i + 1}/${count}] Starting Qwen thumbnail generation for: "${title}"...`);
    try {
      const buffer = await generateSingleThumbnail(frames, title, description);
      const filename = `thumb_${i + 1}.jpg`;
      const filePath = path.join(publicDir, filename);

      const base64Data = buffer.toString("base64");
      const dataUrl = `data:image/jpeg;base64,${base64Data}`;

      fs.writeFileSync(filePath, buffer);
      console.log(`[Sequential ${i + 1}/${count}] Successfully saved thumbnail to ${filePath}`);

      results.push({
        id: `variant_${i + 1}`,
        imageUrl: dataUrl,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to generate thumbnail ${i + 1}:`, msg);
      throw err;
    }
  }

  return results;
}

async function pollDashScopeTask(taskId: string, apiKey: string): Promise<string> {
  const pollUrl = `https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`;
  while (true) {
    const res = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`DashScope task polling failed: ${res.status}`);
    const data = await res.json();
    const taskStatus = data.output?.task_status;

    if (taskStatus === "SUCCEEDED") {
      const url = data.output?.results?.[0]?.url || data.output?.results?.[0]?.image;
      if (url) return url;
      throw new Error("Task succeeded but no image URL in output.");
    }
    if (taskStatus === "FAILED") {
      throw new Error(`DashScope image task failed: ${data.output?.message || "Unknown error"}`);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }
}
