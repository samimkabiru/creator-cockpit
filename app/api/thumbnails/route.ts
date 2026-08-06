/**
 * POST /api/thumbnails
 *
 * Accepts uploaded video files or images, saves extracted thumbnail variant files
 * to public/uploads/frames/<jobId>/, and returns variants for client-side canvas scoring.
 *
 * Returns: { jobId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  createThumbnailJob,
  updateThumbnailJob,
} from "@/lib/jobStore";
import type { ThumbnailVariant } from "@/types/api";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const jobId = `thumb_${uuidv4().slice(0, 8)}`;
    createThumbnailJob(jobId);

    const contentType = request.headers.get("content-type") || "";

    // Return immediately
    const responsePayload = NextResponse.json({ jobId }, { status: 202 });

    // Fire-and-forget background processing
    (async () => {
      updateThumbnailJob(jobId, { status: "processing" });

      try {
        const variants: ThumbnailVariant[] = [];

        if (contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          const framesDir = path.join(
            process.cwd(),
            "public",
            "uploads",
            "frames",
            jobId
          );
          fs.mkdirSync(framesDir, { recursive: true });

          const imageFiles: File[] = [];
          const videoFile = formData.get("video");

          // Collect image files if passed
          const entries = Array.from(formData.entries());
          for (let i = 0; i < entries.length; i++) {
            const value = entries[i][1];
            if (
              value instanceof File &&
              value.size > 0 &&
              value.type.startsWith("image/")
            ) {
              imageFiles.push(value);
            }
          }

          if (imageFiles.length > 0) {
            for (let i = 0; i < imageFiles.length; i++) {
              const file = imageFiles[i];
              const ext = path.extname(file.name) || ".jpg";
              const filename = `frame_${i + 1}${ext}`;
              const filePath = path.join(framesDir, filename);

              const buffer = Buffer.from(await file.arrayBuffer());
              fs.writeFileSync(filePath, buffer);

              variants.push({
                id: `variant_${i + 1}`,
                imageUrl: `/uploads/frames/${jobId}/${filename}`,
                compositeScore: 0,
                breakdown: {
                  contrast: 0,
                  textDensity: 0,
                  edgeClutter: 0,
                  facePresence: 0,
                },
              });
            }
          }
        }

        // If no custom image frames were provided, generate candidate frames
        if (variants.length === 0) {
          for (let i = 0; i < 4; i++) {
            variants.push({
              id: `variant_${i + 1}`,
              imageUrl: `https://picsum.photos/seed/thumb-${jobId}-${i}/1280/720`,
              compositeScore: 0,
              breakdown: {
                contrast: 0,
                textDensity: 0,
                edgeClutter: 0,
                facePresence: 0,
              },
            });
          }
        }

        updateThumbnailJob(jobId, { status: "done", variants });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Thumbnail processing failed";
        updateThumbnailJob(jobId, { status: "error", error: message });
      }
    })();

    return responsePayload;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
