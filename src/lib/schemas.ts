import { z } from 'zod';

export const CreditSchema = z.object({
  role: z.string(),
  name: z.string(),
});

export const VideoItemSchema = z.object({
  id: z.string(),
  youtubeId: z.string(),
  title: z.string(),
  shortTitle: z.string(),
  client: z.string(),
  role: z.string(),
  publishedAt: z.string(),
  durationSec: z.number(),
  durationFormatted: z.string(),
  views: z.number(),
  likes: z.number().optional().default(0),
  thumbnailUrl: z.string().optional(),
  dominantColor: z.string().default('#2563eb'),
  secondaryColor: z.string().default('#06b6d4'),
  isPinned: z.boolean().default(false),
  pinOrder: z.number().optional().default(999),
  isShort: z.boolean().default(false),
  visualTheme: z.string().optional().default('cyber-pursuit'),
  brief: z.string().default('Directed and edited by Director Menny.'),
  behindTheScenes: z.string().default('Shot on large-format anamorphic cinema optics with custom lighting choreography.'),
  toolsUsed: z.array(z.string()).default(['Premiere Pro', 'DaVinci Resolve', 'After Effects']),
  credits: z.array(CreditSchema).default([{ role: 'Director & Editor', name: 'Director Menny' }]),
});

export type VideoItem = z.infer<typeof VideoItemSchema>;

export const VideosApiResponseSchema = z.object({
  videos: z.array(VideoItemSchema),
  fetchedAt: z.string(),
  isLive: z.boolean(),
  source: z.enum(['youtube_api', 'curated_fallback']),

});

export type VideosApiResponse = z.infer<typeof VideosApiResponseSchema>;

export const ArtworkCategorySchema = z.enum([
  'All',
  'Cinematic',
  'Characters',
  'Environments',
  'Concept',
]);

export type ArtworkCategory = z.infer<typeof ArtworkCategorySchema>;

export const ArtworkItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['Cinematic', 'Characters', 'Environments', 'Concept']),
  aspectRatio: z.string().default('16:9'),
  dominantColor: z.string(),
  secondaryColor: z.string().optional().default('#06b6d4'),
  visualPreset: z.string(),
  tool: z.string(),
  createdAt: z.string(),
  tags: z.array(z.string()),
  promptSummary: z.string(),
  instagramUrl: z.string().optional(),
  instagramShortcode: z.string().optional(),
  mediaType: z.enum(['post', 'reel']).optional().default('reel'),
  thumbnailUrl: z.string().optional(),
  videoUrl: z.string().optional(),
});

export type ArtworkItem = z.infer<typeof ArtworkItemSchema>;

export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  artistOrLabel: z.string().optional().default(''),
  serviceType: z.string().min(2, 'Please select a service tier'),
  budgetRange: z.string().optional().default('$10k – $25k'),
  message: z.string().min(10, 'Brief must be at least 10 characters'),
  honeypot: z.string().optional().default(''),
});

export type ContactFormInput = z.infer<typeof ContactFormSchema>;

export type TrophyTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TrophyMilestone {
  tier: Exclude<TrophyTier, 'none'>;
  label: string;
  threshold: number;
  unlocked: boolean;
  description: string;
}

export function computeTrophies(views: number): {
  highestTier: TrophyTier;
  level: number;
  progressPercent: number;
  milestones: TrophyMilestone[];
} {
  const milestones: TrophyMilestone[] = [
    {
      tier: 'bronze',
      label: 'Bronze Cut',
      threshold: 1_000,
      unlocked: views >= 1_000,
      description: 'Surpassed 1,000 verified views on YouTube',
    },
    {
      tier: 'silver',
      label: 'Silver Reel',
      threshold: 10_000,
      unlocked: views >= 10_000,
      description: 'Surpassed 10,000 verified views on YouTube',
    },
    {
      tier: 'gold',
      label: 'Gold Premiere',
      threshold: 100_000,
      unlocked: views >= 100_000,
      description: 'Surpassed 100,000 verified views on YouTube',
    },
    {
      tier: 'platinum',
      label: 'Platinum Masterpiece',
      threshold: 1_000_000,
      unlocked: views >= 1_000_000,
      description: 'Surpassed 1,000,000 verified views on YouTube',
    },
  ];

  let highestTier: TrophyTier = 'none';
  if (views >= 1_000_000) highestTier = 'platinum';
  else if (views >= 100_000) highestTier = 'gold';
  else if (views >= 10_000) highestTier = 'silver';
  else if (views >= 1_000) highestTier = 'bronze';

  // Calculate level (1 to 50) & progress percent to next milestone
  let progressPercent = 0;
  let level = 1;
  if (views >= 1_000_000) {
    progressPercent = 100;
    level = Math.min(50, 40 + Math.floor(views / 500_000));
  } else if (views >= 100_000) {
    progressPercent = Math.round(((views - 100_000) / 900_000) * 100);
    level = 25 + Math.floor((progressPercent / 100) * 14);
  } else if (views >= 10_000) {
    progressPercent = Math.round(((views - 10_000) / 90_000) * 100);
    level = 12 + Math.floor((progressPercent / 100) * 12);
  } else if (views >= 1_000) {
    progressPercent = Math.round(((views - 1_000) / 9_000) * 100);
    level = 4 + Math.floor((progressPercent / 100) * 7);
  } else {
    progressPercent = Math.round((views / 1_000) * 100);
    level = Math.max(1, Math.floor((views / 1_000) * 3));
  }

  return {
    highestTier,
    level,
    progressPercent: Math.max(4, Math.min(100, progressPercent)),
    milestones,
  };
}
