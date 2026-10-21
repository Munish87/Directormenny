# DM OS — 3D Spatial Console Portfolio for Director Menny

**DM OS** is a production-ready 3D spatial console portfolio for music video director and editor **Director Menny**. It replicates next-generation console UX in layout, spatial focus graph, camera choreography, trophy milestones, and acoustic feedback using 100% original **DM** geometric branding.

---

## 1. Environment Variables (`.env.local` / `.env`)

Copy `.env.example` to `.env` or `.env.local` and configure:

```bash
# Server-only YouTube Data API v3 Key (never exposed to the client bundle)
YOUTUBE_API_KEY="YOUR_YOUTUBE_DATA_API_V3_KEY"

# Single YouTube Channel ID or comma-separated list of Channel IDs (UC...)
YOUTUBE_CHANNEL_ID="UC_x5XG1OV2P6uZZ5FSM9Ttw"

# Set to "true" to include YouTube Shorts (<= 60s)
INCLUDE_SHORTS="false"

# Optional Resend API key for Contact / Commission form email dispatch
RESEND_API_KEY=""
CONTACT_EMAIL="booking@directormenny.studio"
```

When `YOUTUBE_API_KEY` is omitted or quota is exceeded, `/api/videos` automatically validates and serves `/content/videos.fallback.json` merged with `/content/featured.json`.

---

## 2. Adding or Pinning Videos & AI Art

- **Pinning & Custom Video Metadata (`/content/featured.json`)**:
  Add an entry matching the video's `youtubeId` with `isPinned: true`, `pinOrder`, `client`, `role`, `dominantColor`, `brief`, `behindTheScenes`, `toolsUsed`, and `credits`.
- **Fallback Video Catalog (`/content/videos.fallback.json`)**:
  Add or edit curated showcase videos when running offline or without a YouTube API key.
- **AI Art Media Gallery (`/content/artwork.json`)**:
  Add new items with `category` (`Cinematic` | `Characters` | `Environments` | `Concept`), `tool`, `tags`, and `promptSummary`.
- **Director Profile & Services (`/content/credits.json`)**:
  Update Director Menny's bio, statistics, service packages, camera/VFX pipeline tools, and client list.

---

## 3. Console Controls & Input System

DM OS supports seamless switching between **Gamepad Controller**, **Keyboard**, **Mouse**, and **Touch**:
- **Navigate Focus Graph**: D-Pad / Left Stick / Arrow Keys / `W A S D`
- **Select / Confirm**: `Cross / A` / `Enter` / `Space` / Click
- **Back / Reverse Camera Dolly**: `Circle / B` / `Esc` / `Backspace`
- **Switch Primary Tabs (`Videos` ↔ `AI Art`)**: `L1 / R1` or `Q / E`
- **Open Control Center Dock**: `Guide Button` / `G` / `Home` / Click the top-left `DM` emblem
- **Global Search Overlay**: `Triangle / Y` / `/`

---

## 4. Development & Deployment

```bash
npm install
npm run dev      # Starts full-stack Express + Vite server on http://localhost:3000
npm run build    # Production bundle build
npm run lint     # TypeScript strict type-checking
```
