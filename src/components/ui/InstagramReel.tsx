import { useEffect, useRef } from 'react';

type InstagramWindow = Window & {
  instgrm?: { Embeds: { process: () => void } };
};

let embedScript: Promise<void> | undefined;

function loadEmbedScript() {
  if ((window as InstagramWindow).instgrm) return Promise.resolve();
  if (!embedScript) {
    embedScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        embedScript = undefined;
        reject(new Error('Instagram embed could not load'));
      };
      document.body.appendChild(script);
    });
  }
  return embedScript;
}

export function InstagramReel({ url, title }: { url: string; title: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let active = true;
    // Instagram replaces the blockquote with its player. Keep that DOM outside
    // React's children so switching reels and closing the viewer remain safe.
    const quote = document.createElement('blockquote');
    quote.className = 'instagram-media';
    quote.setAttribute('data-instgrm-captioned', '');
    quote.setAttribute('data-instgrm-permalink', url);
    quote.setAttribute('data-instgrm-version', '14');
    quote.style.cssText = 'background:#fff;border:0;margin:0;width:100%;min-width:0;max-width:540px;padding:16px;color:#111';
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `Watch ${title} on Instagram`;
    quote.appendChild(link);
    host.replaceChildren(quote);
    loadEmbedScript().then(() => {
      if (active) (window as InstagramWindow).instgrm?.Embeds.process();
    }).catch(() => {
      // The original link remains usable if the external script is blocked.
    });
    return () => {
      active = false;
      host.replaceChildren();
    };
  }, [url, title]);

  return (
    <div className="absolute inset-2 md:inset-4 overflow-auto overscroll-contain">
      <div ref={hostRef} className="instagram-reel mx-auto w-full max-w-[540px]" />
    </div>
  );
}
