# 🎬 Creator Cockpit

> **AI-Powered Automated YouTube Content & Thumbnail Studio**  
> *Transform raw videos into YouTube-ready chapters, high-CTR titles, SEO descriptions, promotional tweets, and Qwen AI thumbnails in seconds.*

---

## ⚡ Highlights

- **🎙️ AssemblyAI Timestamped Transcription**: Server-side FFmpeg audio extraction automatically converts video to `.mp3` and generates word-level `[MM:SS]` timestamped transcripts.
- **🧠 Gemini 2.5 Flash Strategy Engine**: Generates accurate chapter markers, 3 viral title variations, SEO description, hashtags, pinned comment, tweet promo, and viral shorts candidates.
- **🎨 Qwen (`wan2.7-image-pro`) Thumbnail Generator**: Sequentially inspects 3–4 real video keyframes to preserve creator facial identity and scene context while generating 2K YouTube thumbnails.
- **📊 Real-Time Canvas Visual Scoring**: Computes client-side contrast, graphic density, and visual simplicity scores on an HTML5 canvas.
- **📈 Live Upload Progress Bar**: Percentage loading bar (`XMLHttpRequest`) streaming video buffers to the server with zero timeout issues.

---

## 🛠️ Architecture & Pipeline

```
[User Video File]
       │
       ▼
[Client Progress Upload (XMLHttpRequest)]
       │
       ▼
[FFmpeg Audio Extraction] ──► Converts video to lightweight MP3 buffer
       │
       ▼
[AssemblyAI API] ───────────► Timestamped word transcript [MM:SS]
       │
       ▼
[Gemini 2.5 Flash] ─────────► Chapters, Titles, Description, Tweets, Shorts
       │
       ▼
[Client Frame Extractor] ──► Extracts 3-4 keyframes from video at chapter points
       │
       ▼
[Qwen wan2.7-image-pro] ────► Sequential 2K AI Thumbnails (Multi-frame context)
       │
       ▼
[HTML5 Canvas Evaluator] ──► Live Contrast, Text Balance, and Visual Simplicity Scores
```

---

## 🧰 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Framework** | [Next.js 14 (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | Vanilla CSS Design System with Glassmorphism & Animations |
| **Transcription** | [AssemblyAI REST API & SDK](https://www.assemblyai.com/) |
| **Audio Processing** | [FFmpeg Static](https://github.com/eugeneware/ffmpeg-static) |
| **Metadata Engine** | [Google Gemini 2.5 Flash](https://ai.google.dev/) |
| **Thumbnail Engine** | [Alibaba Qwen (`wan2.7-image-pro`) via DashScope](https://dashscope.aliyun.com/) |
| **Visual Scoring** | HTML5 Canvas API + WCAG Luminance & Sobel Convolution |

---

## 🔑 Environment Variables Setup

Create a `.env.local` file in the root directory:

```env
# Google Gemini API Key for Metadata & Strategy
GEMINI_API_KEY=AIzaSy...

# AssemblyAI Key for Timestamped Video Transcription
ASSEMBLYAI_API_KEY=84d0010657a54ae2a427ed61d7111b65

# Qwen DashScope Key for wan2.7-image-pro Thumbnail Generation
DASHSCOPE_API_KEY=sk-...
```

---

## 🚀 Getting Started

### 1. Clone the repository & install dependencies

```bash
git clone https://github.com/your-username/creator-cockpit.git
cd creator-cockpit
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Production Deployment

### Option A: Render (Free Web Service)
1. Push code to GitHub.
2. Create a **New Web Service** on [Render](https://render.com/).
3. Set **Runtime**: `Node`, **Build Command**: `npm run build`, **Start Command**: `npm start`.
4. Add environment variables (`GEMINI_API_KEY`, `ASSEMBLYAI_API_KEY`, `DASHSCOPE_API_KEY`).

### Option B: Railway (Unlimited Execution Time)
1. Import repository on [Railway](https://railway.app/).
2. Add your environment variables in the Railway dashboard.
3. Click **Generate Public Domain**.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
