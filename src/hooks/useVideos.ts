import { useEffect } from 'react';
import { useDmStore } from '../lib/store';
import { VideosApiResponseSchema } from '../lib/schemas';

export function useVideos() {
  const setVideosPayload = useDmStore((s) => s.setVideosPayload);

  useEffect(() => {
    let active = true;

    async function loadVideos() {
      try {
        const res = await fetch('/api/videos');
        if (!res.ok) return;
        const json = await res.json();
        const parsed = VideosApiResponseSchema.safeParse(json);
        if (parsed.success && active) {
          setVideosPayload({
            videos: parsed.data.videos,
            isLive: parsed.data.isLive,
            source: parsed.data.source,
          });
        }
      } catch {
        // Fallback videos are already loaded in initial store state
      }
    }

    loadVideos();
    // Poll every 30 minutes (1800s) so new uploads appear without redeploy
    const interval = window.setInterval(loadVideos, 1800 * 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [setVideosPayload]);

}
