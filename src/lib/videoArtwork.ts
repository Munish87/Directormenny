import type { VideoItem } from './schemas';
import { getArtworkDataUri } from './proceduralArt';

export function getVideoArtwork(video: VideoItem): string {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  if (video.youtubeId) return `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`;
  return getArtworkDataUri(video.visualTheme || 'cyber-pursuit', video.dominantColor, video.secondaryColor, video.shortTitle);
}
