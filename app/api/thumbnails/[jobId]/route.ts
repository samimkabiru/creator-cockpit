/**
 * GET /api/thumbnails/[jobId]
 *
 * Polls the status of a thumbnail analysis job.
 * Returns ThumbnailJobResponse matching the types/api.ts contract.
 */

import { NextRequest, NextResponse } from "next/server";
import { getThumbnailJob } from "@/lib/jobStore";

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  const job = getThumbnailJob(jobId);

  if (!job) {
    return NextResponse.json(
      { status: "error" as const, error: `Thumbnail job '${jobId}' not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: job.status,
    variants: job.variants,
    error: job.error,
  });
}
