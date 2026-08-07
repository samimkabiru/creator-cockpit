import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createProcessJob, updateProcessJob } from '@/lib/jobStore';
import { parseTranscript } from '@/lib/transcriptService';
import { generateContentFromTranscript } from '@/lib/llmService';
import { transcribeVideo } from '@/lib/assemblyService';

export async function POST(req: NextRequest) {
  const jobId = `proc_${uuidv4().slice(0, 8)}`;
  createProcessJob(jobId);

  let transcript: string | null = null;
  let video: File | null = null;

  try {
    const formData = await req.formData();
    transcript = formData.get('transcript') as string | null;
    video = formData.get('video') as File | null;
  } catch {
    updateProcessJob(jobId, { status: 'error', error: 'Failed to parse form data' });
    return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
  }

  // Fire-and-forget processing
  (async () => {
    try {
      if (!video && !transcript) {
        throw new Error('No video file or transcript provided');
      }

      updateProcessJob(jobId, { status: 'processing' });

      if (video) {
        const { timestampedTranscript, durationSeconds } = await transcribeVideo(video);
        console.log('Transcription complete:', durationSeconds, 'seconds');
        
        const result = await generateContentFromTranscript(timestampedTranscript);
        updateProcessJob(jobId, { status: 'done', result });
      } else if (transcript) {
        const cleaned = await parseTranscript(transcript);
        const result = await generateContentFromTranscript(cleaned);
        updateProcessJob(jobId, { status: 'done', result });
      }
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      updateProcessJob(jobId, { status: 'error', error: message });
    }
  })();

  return NextResponse.json({ jobId }, { status: 202 });
}
