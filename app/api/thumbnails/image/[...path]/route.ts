/**
 * Streams a generated thumbnail image from os.tmpdir() to the browser.
 * 
 * URL pattern: /api/thumbnails/image/[jobId]/[filename]
 * Example:     /api/thumbnails/image/thumb_62ce1627/thumb_1.jpg
 * 
 * This avoids holding base64 strings in RAM (which caused Render 512MB OOM crashes)
 * and bypasses Next.js's build-time-only public/ directory caching.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // path segments: [jobId, filename]
  const segments = params.path;
  if (!segments || segments.length < 2) {
    return NextResponse.json({ error: "Missing jobId or filename" }, { status: 400 });
  }

  const jobId = segments[0];
  const filename = segments[1];

  // Sanitize — prevent directory traversal
  if (jobId.includes("..") || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filePath = path.join(os.tmpdir(), "creator_cockpit_thumbs", jobId, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(fileBuffer.length),
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
