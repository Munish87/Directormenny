import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  ContactFormSchema,
  VideoItem,
  VideoItemSchema,
  VideosApiResponse,
} from './src/lib/schemas.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const CACHE_TTL_MS = 1800 * 1000; // 1800 seconds (30 minutes)

interface CachedVideos {
  data: VideosApiResponse;
  timestamp: number;
}

let videosCache: CachedVideos | null = null;
const contactSubmissions: Array<Record<string, unknown>> = [];

function parseIsoDurationToSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function readJsonFile<T>(relativePath: string, defaultVal: T): T {
  try {
    const fullPath = path.resolve(__dirname, relativePath);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

async function fetchLiveYouTubeVideos(includeShortsFlag: boolean): Promise<VideoItem[] | null> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const rawChannels = process.env.YOUTUBE_CHANNEL_ID?.trim();

  if (!apiKey || !rawChannels || apiKey === 'MY_YOUTUBE_API_KEY') {
    return null;
  }

  const channelIds = rawChannels
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (channelIds.length === 0) return null;

  const featuredList = readJsonFile<Array<Partial<VideoItem>>>('content/featured.json', []);
  const featuredByYtId = new Map<string, Partial<VideoItem>>();
  for (const item of featuredList) {
    if (item.youtubeId) {
      featuredByYtId.set(item.youtubeId, item);
    }
  }

  // 1. Resolve uploads playlists (UC -> UU or channels.list)
  const uploadPlaylistIds: string[] = [];
  const channelsUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
  channelsUrl.searchParams.set('part', 'contentDetails');
  channelsUrl.searchParams.set('id', channelIds.join(','));
  channelsUrl.searchParams.set('key', apiKey);

  const chanRes = await fetch(channelsUrl.toString());
  if (!chanRes.ok) {
    throw new Error(`YouTube channels.list failed with status ${chanRes.status}`);
  }
  const chanJson = (await chanRes.json()) as {
    items?: Array<{
      id: string;
      contentDetails?: { relatedPlaylists?: { uploads?: string } };
    }>;
  };

  for (const ch of chanJson.items || []) {
    const uploadsId =
      ch.contentDetails?.relatedPlaylists?.uploads ||
      (ch.id.startsWith('UC') ? `UU${ch.id.slice(2)}` : '');
    if (uploadsId) uploadPlaylistIds.push(uploadsId);
  }

  if (uploadPlaylistIds.length === 0) return null;

  // 2. Paginate playlistItems.list (up to 50 items per playlist)
  const videoIds: string[] = [];
  for (const playlistId of uploadPlaylistIds) {
    let pageToken = '';
    let pagesFetched = 0;
    while (pagesFetched < 2) {
      const plUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      plUrl.searchParams.set('part', 'contentDetails');
      plUrl.searchParams.set('playlistId', playlistId);
      plUrl.searchParams.set('maxResults', '50');
      if (pageToken) plUrl.searchParams.set('pageToken', pageToken);
      plUrl.searchParams.set('key', apiKey);

      const plRes = await fetch(plUrl.toString());
      if (!plRes.ok) break;
      const plData = (await plRes.json()) as {
        nextPageToken?: string;
        items?: Array<{ contentDetails?: { videoId?: string } }>;
      };

      for (const item of plData.items || []) {
        if (item.contentDetails?.videoId) {
          videoIds.push(item.contentDetails.videoId);
        }
      }
      pagesFetched += 1;
      if (!plData.nextPageToken) break;
      pageToken = plData.nextPageToken;
    }
  }

  if (videoIds.length === 0) return null;

  // 3. Batch fetch videos.list (statistics, contentDetails, snippet)
  const uniqueIds = Array.from(new Set(videoIds)).slice(0, 50);
  const vidUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  vidUrl.searchParams.set('part', 'snippet,contentDetails,statistics');
  vidUrl.searchParams.set('id', uniqueIds.join(','));
  vidUrl.searchParams.set('key', apiKey);

  const vidRes = await fetch(vidUrl.toString());
  if (!vidRes.ok) {
    throw new Error(`YouTube videos.list failed with status ${vidRes.status}`);
  }

  const vidData = (await vidRes.json()) as {
    items?: Array<{
      id: string;
      snippet?: {
        title?: string;
        publishedAt?: string;
        channelTitle?: string;
        thumbnails?: {
          maxres?: { url?: string };
          standard?: { url?: string };
          high?: { url?: string };
        };
      };
      contentDetails?: { duration?: string };
      statistics?: { viewCount?: string; likeCount?: string };
    }>;
  };

  const paletteCycle = [
    { dominant: '#2563eb', secondary: '#06b6d4', theme: 'cyber-pursuit' },
    { dominant: '#f59e0b', secondary: '#dc2626', theme: 'solar-eclipse' },
    { dominant: '#8b5cf6', secondary: '#ec4899', theme: 'liquid-chrome' },
    { dominant: '#10b981', secondary: '#0ea5e9', theme: 'emerald-labyrinth' },
    { dominant: '#06b6d4', secondary: '#3b82f6', theme: 'orbital-arena' },
    { dominant: '#e11d48', secondary: '#f97316', theme: 'crimson-protocol' },
  ];

  const mapped: VideoItem[] = [];
  for (let i = 0; i < (vidData.items || []).length; i++) {
    const raw = vidData.items![i];
    const durationSec = parseIsoDurationToSeconds(raw.contentDetails?.duration || 'PT0S');
    const isShort = durationSec > 0 && durationSec <= 60;
    if (isShort && !includeShortsFlag) {
      continue;
    }

    const feat = featuredByYtId.get(raw.id);
    const palette = paletteCycle[i % paletteCycle.length];
    const thumb =
      raw.snippet?.thumbnails?.maxres?.url ||
      raw.snippet?.thumbnails?.standard?.url ||
      raw.snippet?.thumbnails?.high?.url ||
      `https://i.ytimg.com/vi/${raw.id}/hqdefault.jpg`;

    const fullTitle = raw.snippet?.title || 'Untitled Director Cut';
    const shortTitle = fullTitle.includes('—')
      ? fullTitle.split('—')[1].replace(/\(.*?\)/g, '').trim()
      : fullTitle.slice(0, 28);

    const candidate = VideoItemSchema.parse({
      id: feat?.id || `yt-${raw.id}`,
      youtubeId: raw.id,
      title: fullTitle,
      shortTitle: shortTitle || fullTitle,
      client: feat?.client || `${raw.snippet?.channelTitle || 'STUDIO COMMISSION'}`,
      role: feat?.role || 'Director & Lead Editor',
      publishedAt: raw.snippet?.publishedAt || new Date().toISOString(),
      durationSec,
      durationFormatted: formatDuration(durationSec),
      views: parseInt(raw.statistics?.viewCount || '0', 10),
      likes: parseInt(raw.statistics?.likeCount || '0', 10),
      thumbnailUrl: thumb,
      dominantColor: feat?.dominantColor || palette.dominant,
      secondaryColor: feat?.secondaryColor || palette.secondary,
      isPinned: Boolean(feat?.isPinned),
      pinOrder: feat?.pinOrder ?? 999,
      isShort,
      visualTheme: feat?.visualTheme || palette.theme,
      brief:
        feat?.brief ||
        'Directed and edited by Director Menny with custom anamorphic optics and theatrical color finishing.',
      behindTheScenes:
        feat?.behindTheScenes ||
        'Captured on large-format digital cinema sensors with synchronized DMX lighting rigs.',
      toolsUsed: feat?.toolsUsed || ['ARRI Alexa Mini LF', 'Premiere Pro', 'DaVinci Resolve'],
      credits: feat?.credits || [{ role: 'Director & Editor', name: 'Director Menny' }],
    });

    mapped.push(candidate);
  }

  // Sort pinned first by pinOrder, then newest first
  mapped.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isPinned && b.isPinned) return (a.pinOrder || 999) - (b.pinOrder || 999);
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return mapped.length > 0 ? mapped : null;
}

function buildFallbackResponse(includeShorts: boolean): VideosApiResponse {
  const rawFallback = readJsonFile<unknown[]>('content/videos.fallback.json', []);
  const featuredList = readJsonFile<Array<Partial<VideoItem>>>('content/featured.json', []);
  const featuredMap = new Map<string, Partial<VideoItem>>();
  for (const f of featuredList) {
    if (f.id) featuredMap.set(f.id, f);
  }

  const parsedVideos: VideoItem[] = [];
  for (const item of rawFallback) {
    const parsed = VideoItemSchema.safeParse(item);
    if (parsed.success) {
      if (parsed.data.isShort && !includeShorts) continue;
      const feat = featuredMap.get(parsed.data.id);
      parsedVideos.push({
        ...parsed.data,
        ...(feat
          ? {
              isPinned: feat.isPinned ?? parsed.data.isPinned,
              pinOrder: feat.pinOrder ?? parsed.data.pinOrder,
              client: feat.client ?? parsed.data.client,
              role: feat.role ?? parsed.data.role,
              brief: feat.brief ?? parsed.data.brief,
              behindTheScenes: feat.behindTheScenes ?? parsed.data.behindTheScenes,
              toolsUsed: feat.toolsUsed ?? parsed.data.toolsUsed,
              credits: feat.credits ?? parsed.data.credits,
            }
          : {}),
      });
    }
  }

  parsedVideos.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isPinned && b.isPinned) return (a.pinOrder || 999) - (b.pinOrder || 999);
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const nowIso = new Date().toISOString();

  return {
    videos: parsedVideos,
    fetchedAt: nowIso,
    isLive: true,
    source: 'curated_fallback',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // GET /api/videos — Server-only YouTube Data API v3 with 1800s revalidate cache & Zod fallback
  app.get('/api/videos', async (req, res) => {
    const includeShorts =
      req.query.includeShorts === 'true' || process.env.INCLUDE_SHORTS === 'true';
    const forceRefresh = req.query.refresh === 'true';

    const now = Date.now();
    if (videosCache && !forceRefresh && now - videosCache.timestamp < CACHE_TTL_MS) {
      const ageMs = now - new Date(videosCache.data.fetchedAt).getTime();
      res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
      return res.json({
        ...videosCache.data,
        isLive: ageMs < 3600 * 1000,
      });
    }

    try {
      const liveVideos = await fetchLiveYouTubeVideos(includeShorts);
      if (liveVideos && liveVideos.length > 0) {
        const fetchedAt = new Date().toISOString();
        const payload: VideosApiResponse = {
          videos: liveVideos,
          fetchedAt,
          isLive: true,
          source: 'youtube_api',
        };
        videosCache = { data: payload, timestamp: now };
        res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
        return res.json(payload);
      }
    } catch (err) {
      console.warn('YouTube API fallback triggered:', err instanceof Error ? err.message : err);
    }

    const fallbackPayload = buildFallbackResponse(includeShorts);
    videosCache = { data: fallbackPayload, timestamp: now };
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    return res.json(fallbackPayload);
  });

  // POST /api/contact — Server action with Zod validation, honeypot spam guard, and Resend support
  app.post('/api/contact', async (req, res) => {
    const parsed = ContactFormSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message || 'Invalid message payload',
      });
    }

    const { name, email, artistOrLabel, serviceType, budgetRange, message, honeypot } =
      parsed.data;

    // Honeypot triggered: silently return success to bots
    if (honeypot && honeypot.trim().length > 0) {
      return res.json({
        ok: true,
        referenceId: `DM-BOT-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
      });
    }

    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (!resendKey) {
      return res.status(503).json({ ok: false, error: 'Online booking delivery is unavailable. Please use the email link above to send your inquiry.' });
    }
    const referenceId = `DM-${Date.now().toString(36).toUpperCase()}`;
    const record = {
      referenceId,
      name,
      email,
      artistOrLabel,
      serviceType,
      budgetRange,
      message,
      receivedAt: new Date().toISOString(),
    };
    contactSubmissions.unshift(record);

    // Optional Resend dispatch if RESEND_API_KEY is configured
    const contactEmail = process.env.CONTACT_EMAIL?.trim() || 'menny@directormenny.com';
    if (resendKey) {
      try {
        const delivery = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'DM OS Booking <menny@directormenny.com>',
            to: [contactEmail],
            reply_to: email,
            subject: `[DM OS Inquiry ${referenceId}] ${serviceType} — ${name}`,
            text: `Reference: ${referenceId}\nFrom: ${name} (${email})\nArtist/Label: ${artistOrLabel}\nService: ${serviceType}\nBudget: ${budgetRange}\n\nBrief:\n${message}`,
          }),
        });
        if (!delivery.ok) {
          return res.status(502).json({ ok: false, error: 'Your inquiry could not be delivered. Please retry or use the email link above.' });
        }
      } catch (err) {
        console.warn('Booking delivery failed');
        return res.status(502).json({ ok: false, error: 'Your inquiry could not be delivered. Please retry or use the email link above.' });
      }
    }

    return res.json({
      ok: true,
      referenceId,
      timestamp: record.receivedAt,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DM OS Console Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
