# 🚀 Creator Cockpit — AI-Powered Automated YouTube Studio

> **Turn 3+ Hours of YouTube Post-Production into 30 Seconds.**  
> *Upload a raw video file and automatically generate timestamped chapters, high-CTR titles, SEO descriptions, promotional social posts, and identity-preserving 2K AI thumbnails.*

---

## 🎯 The Problem & Value Proposition

YouTube creators and video editors spend **3 to 5 hours on every video** handling repetitive post-production tasks:
- Manually scrubbing through video timelines to write chapter timestamps.
- Brainstorming click-worthy titles that drive high Click-Through Rate (CTR).
- Writing multi-paragraph SEO descriptions, hashtags, and promotional tweets.
- Spending hours in Photoshop designing thumbnails.

**Creator Cockpit automates 100% of this post-production workflow.**  
Simply drop in your video file, and within seconds, Creator Cockpit generates a complete, professional, publication-ready YouTube release kit.

---

## 🔥 Key Features & Capabilities

### 📌 1. Exact Timestamped Chapter Markers
- Automatically transcribes your video audio with word-level accuracy.
- Identifies major topic transitions and generates formatted `[MM:SS]` YouTube chapter markers.
- Helps viewers navigate content easily, boosting watch time and audience retention.

### ✍️ 2. High-CTR Title Generation
- Produces **3 distinct title variations** tailored for curiosity, viral appeal, and search visibility.
- Engineered to maximize YouTube Click-Through Rate (CTR) under 60 characters.

### 📝 3. Complete SEO Description & Social Kit
- **Full SEO Description**: Multi-paragraph video overview with embedded timestamped chapters and relevant hashtags.
- **Promotional Tweet**: Engaging, ready-to-post Twitter/X promo under 280 characters.
- **Pinned Comment**: Thoughtfully crafted top comment to kickstart community discussion.
- **Shorts Clip Candidates**: Identifies viral 30–60 second highlights in your video with timestamps and visual rationale.

### 🎨 4. Identity-Preserving 2K AI Thumbnails
- Powered by Qwen (`wan2.7-image-pro`).
- Inspects real keyframe clips from your video to **preserve creator facial identity, clothing, and background context**.
- Generates 3 clean, uncluttered, professional 16:9 YouTube thumbnails matching each title variant.

### 📊 5. Real-Time Canvas Visual Scoring
- Analyzes generated thumbnails on an HTML5 canvas for:
  - **Contrast & Visibility (40%)**: Ensures text overlays pop against backgrounds.
  - **Text & Graphic Balance (30%)**: Evaluates optimal visual density (15–30% sweet spot).
  - **Visual Simplicity (30%)**: Inverted edge clutter filter — rewards clean, high-impact designs.

---

## 💡 Why Creator Cockpit Wins for Creators

| Feature | Without Creator Cockpit | With Creator Cockpit |
| :--- | :--- | :--- |
| **Post-Production Time** | 3 – 5 Hours per video | **~30 Seconds** |
| **Chapter Timestamps** | Manual scrubbing & typing | **Automated `[MM:SS]` Markers** |
| **Thumbnail Creation** | 1 – 2 Hours in Photoshop | **Instant 2K AI Generation** |
| **Creator Identity** | Generic stock AI images | **Preserves Actual Face & Scene** |
| **Social Media Assets** | Written manually | **Auto-generated Tweet & Comment** |

---

## 💻 Quick Start & Demo

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Keys (`.env.local`)

```env
GEMINI_API_KEY=your_gemini_key
ASSEMBLYAI_API_KEY=84d0010657a54ae2a427ed61d7111b65
DASHSCOPE_API_KEY=your_qwen_key
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload any video file to watch the full automated workflow in action!

---

## 📄 License

Distributed under the MIT License.
