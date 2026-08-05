/**
 * GET /api/process/[jobId]
 *
 * Polls the status of a content-generation job.
 * Returns ProcessJobResponse matching the types/api.ts contract.
 */

import { NextRequest, NextResponse } from "next/server";
import { getProcessJob } from "@/lib/jobStore";

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  const job = getProcessJob(jobId);

  if (!job) {
    return NextResponse.json(
      { status: "error" as const, error: `Job '${jobId}' not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: job.status,
    result: job.result,
    error: job.error,
  });
}
