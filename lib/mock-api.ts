/**
 * Mock API — simulates the backend with realistic delays.
 *
 * Lifecycle per job: pending (~500ms) → processing (~3-4s) → done
 *
 * This file is imported ONLY by /lib/api.ts (the barrel).
 * No component should import from here directly.
 */

import type {
  JobStatus,
  ProcessJobResponse,
  ProcessResult,
  ThumbnailJobResponse,
  ThumbnailVariant,
} from "@/types/api";

// ---------------------------------------------------------------------------
// In-memory job store
// ---------------------------------------------------------------------------

interface JobRecord {
  status: JobStatus;
  startedAt: number; // Date.now() when job was created
  processingStartedAt?: number;
}

const jobs = new Map<string, JobRecord>();

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function getJobStatus(record: JobRecord): JobStatus {
  const now = Date.now();
  const age = now - record.startedAt;

  if (age < 500) return "pending";
  if (age < 4000) return "processing";
  return "done";
}

// ---------------------------------------------------------------------------
// Realistic placeholder content (fictional tech-review video: "Pixel 9 Pro Review")
// ---------------------------------------------------------------------------

const MOCK_PROCESS_RESULT: ProcessResult = {
  chapters: [
    { timestamp: "0:00", label: "Intro — First impressions" },
    { timestamp: "1:42", label: "Design & build quality" },
    { timestamp: "4:15", label: "Display deep-dive (LTPO OLED, 120Hz)" },
    { timestamp: "7:30", label: "Camera system overview" },
    { timestamp: "10:05", label: "Main camera: daylight samples" },
    { timestamp: "13:22", label: "Ultrawide & 5× telephoto performance" },
    { timestamp: "16:48", label: "Low-light & astrophotography" },
    { timestamp: "19:10", label: "Tensor G4 chip & performance benchmarks" },
    { timestamp: "22:33", label: "Battery life & charging speeds" },
    { timestamp: "25:50", label: "Pixel AI features: Call Screen, Live Translate" },
    { timestamp: "28:40", label: "Software & Android 15 extras" },
    { timestamp: "31:05", label: "Verdict — Who should buy this?" },
  ],

  titles: [
    "Pixel 9 Pro Review: Google Finally Got It Right (Mostly)",
    "I Tested Every Camera Feature on the Pixel 9 Pro — Here's the Honest Truth",
    "Pixel 9 Pro After 30 Days: The Best Android Camera Phone of 2024?",
  ],

  description: `The Pixel 9 Pro is Google's most refined phone yet — but refined doesn't always mean revolutionary. After 30 days of daily use, here's everything you need to know before spending $999.

We cover the new 5× telephoto lens, the Tensor G4 chip's real-world performance (not just benchmark numbers), and whether the battery improvements actually matter in 2024. Plus: the Pixel AI features that work, and the ones that still feel half-baked.

Chapters are timestamped below. Camera samples were shot in real conditions, no cherry-picking.

📱 Pixel 9 Pro on Google Store: https://store.google.com/product/pixel_9_pro
📷 Full-res sample photos (Google Photos album): [link in comments]

Gear used in this video:
– Canon R6 II (b-roll)
– DJI Osmo Pocket 3 (walking shots)
– Deity V-Mic D4 Mini

#Pixel9Pro #GooglePixel #AndroidReview`,

  hashtags: [
    "#Pixel9Pro",
    "#GooglePixel",
    "#AndroidReview",
    "#SmartphoneCamera",
    "#TechReview",
    "#Android15",
    "#MobilePhotography",
  ],

  pinnedComment: `📌 CHAPTERS & QUICK LINKS

0:00 Intro
1:42 Design & build
4:15 Display
7:30 Camera overview
10:05 Main camera daylight
13:22 Ultrawide & 5× telephoto
16:48 Low-light & astrophotography
19:10 Tensor G4 benchmarks
22:33 Battery life
25:50 Pixel AI features
28:40 Software & Android 15
31:05 Verdict

Full-res camera samples → Google Photos album (link below)
Questions? Drop them below — I read every comment for the first 48 hours.`,

  tweet: `New video: I spent 30 days with the Pixel 9 Pro so you don't have to.

The 5× camera is genuinely great. The Tensor G4 is still Tensor. Battery is better. AI features are 50/50.

Full review (32 min, timestamped) → [link]`,

  shorts: [
    {
      start: "10:05",
      end: "11:20",
      reason:
        "Side-by-side daylight shot comparison vs iPhone 16 Pro — visually punchy, self-contained in 75 seconds",
    },
    {
      start: "16:48",
      end: "17:55",
      reason:
        "Astrophotography mode in real-time — dramatic result reveal moment works perfectly as a standalone short",
    },
    {
      start: "25:50",
      end: "26:40",
      reason:
        "Live Translate demo with Japanese audio — impressive feature showcase, clear hook and payoff under 60 seconds",
    },
  ],
};

// ---------------------------------------------------------------------------
// Thumbnail mock data
// ---------------------------------------------------------------------------

const MOCK_THUMBNAIL_VARIANTS: ThumbnailVariant[] = [
  {
    id: "thumb-a",
    imageUrl: "https://picsum.photos/seed/thumb-a/1280/720",
    compositeScore: 81,
    breakdown: {
      contrast: 88,
      textDensity: 74,
      edgeClutter: 72,
    },
  },
  {
    id: "thumb-b",
    imageUrl: "https://picsum.photos/seed/thumb-b/1280/720",
    compositeScore: 63,
    breakdown: {
      contrast: 55,
      textDensity: 80,
      edgeClutter: 60,
    },
  },
  {
    id: "thumb-c",
    imageUrl: "https://picsum.photos/seed/thumb-c/1280/720",
    compositeScore: 48,
    breakdown: {
      contrast: 42,
      textDensity: 65,
      edgeClutter: 38,
    },
  },
  {
    id: "thumb-d",
    imageUrl: "https://picsum.photos/seed/thumb-d/1280/720",
    compositeScore: 31,
    breakdown: {
      contrast: 30,
      textDensity: 20,
      edgeClutter: 28,
    },
  },
];

// ---------------------------------------------------------------------------
// Process job
// ---------------------------------------------------------------------------

export async function startProcessJob(input: {
  video?: File;
  transcript?: string;
}): Promise<{ jobId: string }> {
  // Simulate a brief network round-trip
  await delay(120);
  const jobId = generateId();
  jobs.set(jobId, { status: "pending", startedAt: Date.now() });
  return { jobId };
}

export async function getProcessJob(
  jobId: string
): Promise<ProcessJobResponse> {
  await delay(80);
  const record = jobs.get(jobId);
  if (!record) return { status: "error", error: "Job not found" };

  const status = getJobStatus(record);

  if (status === "done") {
    return { status: "done", result: MOCK_PROCESS_RESULT };
  }

  return { status };
}

// ---------------------------------------------------------------------------
// Thumbnail job
// ---------------------------------------------------------------------------

export async function startThumbnailJob(input: {
  video?: File;
  images?: File[];
}): Promise<{ jobId: string }> {
  await delay(120);
  const jobId = generateId();
  jobs.set(jobId, { status: "pending", startedAt: Date.now() });
  return { jobId };
}

export async function getThumbnailJob(
  jobId: string
): Promise<ThumbnailJobResponse> {
  await delay(80);
  const record = jobs.get(jobId);
  if (!record) return { status: "error" };

  const status = getJobStatus(record);

  if (status === "done") {
    return { status: "done", variants: MOCK_THUMBNAIL_VARIANTS };
  }

  return { status };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
