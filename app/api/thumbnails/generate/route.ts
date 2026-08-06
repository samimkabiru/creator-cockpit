import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createThumbnailJob, updateThumbnailJob } from '@/lib/jobStore';
import { generateAndSaveThumbnails } from '@/lib/thumbnailGenService';
import type { ThumbnailVariant } from '@/types/api';

export const maxDuration = 60; // Allow up to 60s for image generation

export async function POST(request: NextRequest) {
  try {
    const { titles, description, frames } = await request.json();

    if (!Array.isArray(titles) || titles.length === 0) {
      return NextResponse.json(
        { error: 'titles must be an array with at least 1 item' },
        { status: 400 }
      );
    }

    if (!Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { error: 'frames must be an array with at least 1 item' },
        { status: 400 }
      );
    }

    const jobId = `thumb_${uuidv4().slice(0, 8)}`;
    createThumbnailJob(jobId);

    // Fire-and-forget async processing
    (async () => {
      try {
        updateThumbnailJob(jobId, { status: 'processing' });
        
        const results = await generateAndSaveThumbnails(frames, titles, description, jobId);
        
        const variants: ThumbnailVariant[] = results.map(result => ({
          id: result.id,
          imageUrl: result.imageUrl,
          compositeScore: 0,
          breakdown: {
            contrast: 0,
            textDensity: 0,
            edgeClutter: 0,
            facePresence: 0
          }
        }));

        updateThumbnailJob(jobId, { status: 'done', variants });
      } catch (error: unknown) {
        updateThumbnailJob(jobId, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    })();

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }
}
