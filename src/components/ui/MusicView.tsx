import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Play,
  Music2,
  ExternalLink,
} from 'lucide-react';
import { useDmStore } from '../../lib/store';
import { getVideoArtwork } from '../../lib/videoArtwork';
import { useSound } from '../../hooks/useSound';
import { usePhonePerformance } from '../../hooks/usePhonePerformance';

export function MusicView() {
  const phonePerformance = usePhonePerformance();
  const videos = useDmStore((s) => s.videos);
  const musicVideoIndex = useDmStore((s) => s.musicVideoIndex);
  const activeZone = useDmStore((s) => s.activeZone);

  const setMusicVideoIndex = useDmStore((s) => s.setMusicVideoIndex);
  const setZone = useDmStore((s) => s.setActiveZone);
  const { playSound } = useSound();

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentIndex = Math.min(musicVideoIndex, Math.max(0, videos.length - 1));
  const currentVideo = videos[currentIndex] || videos[0];
  const currentColor = currentVideo?.dominantColor || '#2563eb';

  const move = (direction: number) => {
    if (!videos.length) return;
    playSound('focusTick');
    const next = (currentIndex + direction + videos.length) % videos.length;
    setMusicVideoIndex(next);
    setZone('TILE_ROW');
  };

  const playActiveVideo = (vidId: string) => {
    playSound('select');
    setMusicVideoIndex(videos.findIndex((video) => video.id === vidId));
    setIsPlaying(true);
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let distance = 0;
    let lastEvent = 0;
    let lastStep = -Infinity;
    let direction = 0;
    let handled = false;
    let previousMagnitude = 0;
    let peakMagnitude = 0;
    const onWheel = (event: WheelEvent) => {
      // Horizontal trackpad gestures browse covers; vertical wheels scroll the page.
      if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const now = performance.now();
      const nextDirection = Math.sign(event.deltaX);
      const delta = event.deltaX * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientWidth : 1);
      const magnitude = Math.abs(delta);
      // A new acceleration after the previous swipe slows down is a fresh
      // gesture, even when the trackpad keeps emitting momentum events.
      const renewedSwipe = handled && now - lastStep > 200
        && previousMagnitude < peakMagnitude * 0.5
        && magnitude >= Math.max(10, previousMagnitude * 2.5);
      if (now - lastEvent > 140 || (nextDirection !== direction && magnitude > 6) || renewedSwipe) {
        distance = 0;
        handled = false;
        peakMagnitude = 0;
      }
      if (!handled || magnitude > 6) direction = nextDirection;
      lastEvent = now;
      previousMagnitude = magnitude;
      peakMagnitude = Math.max(peakMagnitude, magnitude);
      if (handled) return;
      distance += delta;
      if (Math.abs(distance) < 45) return;
      const state = useDmStore.getState();
      if (!state.videos.length) return;
      state.setMusicVideoIndex((state.musicVideoIndex + Math.sign(distance) + state.videos.length) % state.videos.length);
      state.setActiveZone('TILE_ROW');
      distance = 0;
      handled = true;
      lastStep = now;
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <section
      onKeyDown={(e) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
          e.stopPropagation();
        }
        if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement).closest('button')) {
          e.stopPropagation();
        }
      }}
      className={`music-view ${isPlaying ? 'is-playing' : ''}`}
      aria-label="Music Videos"
      tabIndex={0}
      style={{ '--music-color': currentColor } as React.CSSProperties}
    >
      <div className="music-aura" aria-hidden="true" />

      <div className="music-heading">
        <span className="eyebrow">DIRECTOR MENNY / MUSIC CATALOG</span>
        <h1>Music Visuals.</h1>
        <p>
          Official music videos directed, edited and color graded by Director Menny ({videos.length} releases).
        </p>
      </div>

      {/* 3D Coverflow Stage */}
      <div
        ref={stageRef}
        className="record-stage"
        aria-label="Choose a music video"
        onTouchStart={(e) => {
          touchStart.current = e.touches.length === 1
            ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
            : null;
        }}
        onTouchCancel={() => { touchStart.current = null; }}
        onTouchEnd={(e) => {
          if (touchStart.current && e.changedTouches.length) {
            const dx = e.changedTouches[0].clientX - touchStart.current.x;
            const dy = e.changedTouches[0].clientY - touchStart.current.y;
            if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
          }
          touchStart.current = null;
        }}
      >
        {videos.map((vid, i) => {
          // Keep the neighboring cards mounted beyond the visible edge so they
          // glide into place instead of appearing midway through a transition.
          let offset = (i - currentIndex + videos.length) % videos.length;
          if (offset > videos.length / 2) offset -= videos.length;
          if (Math.abs(offset) > (phonePerformance ? 1 : 3)) return null;
          if (isPlaying && i !== currentIndex) return null;
          if (i === currentIndex && isPlaying) {
            return (
              <article key={vid.id} className="record-card is-current expanded-video-card" aria-label={`Playing ${vid.shortTitle}`}>
                <div className="record-cover record-video-cover">
                  <iframe
                    src={`https://www.youtube.com/embed/${vid.youtubeId}?autoplay=1&playsinline=1&rel=0&controls=1`}
                    title={vid.title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <div className="expanded-video-caption">
                  <div><strong>{vid.shortTitle}</strong><span>{vid.client}</span></div>
                  <button type="button" onClick={() => setIsPlaying(false)}>Back to covers</button>
                </div>
              </article>
            );
          }
          return (
            <button
              key={vid.id}
              type="button"
              aria-label={`Select ${vid.shortTitle}`}
              aria-pressed={i === currentIndex}
              aria-hidden={Math.abs(offset) > 2 || undefined}
              tabIndex={Math.abs(offset) > 2 ? -1 : 0}
              className={`record-card ${i === currentIndex ? 'is-current' : ''}`}
              style={
                {
                  '--offset': offset,
                  zIndex: 10 - Math.abs(offset),
                  opacity: Math.abs(offset) > 2 ? 0 : offset === 0 ? 1 : 0.65,
                  pointerEvents: Math.abs(offset) > 2 ? 'none' : undefined,
                } as React.CSSProperties
              }
              onClick={() => {
                if (i === currentIndex) {
                  playActiveVideo(vid.id);
                } else {
                  playSound('focusTick');
                  setMusicVideoIndex(i);
                  setZone('TILE_ROW');
                }
              }}
              onDoubleClick={() => playActiveVideo(vid.id)}
            >
              <div className="record-cover">
                <img
                  src={getVideoArtwork(vid)}
                  alt={vid.title}
                  draggable={false}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (vid.youtubeId && !target.src.includes('hqdefault.jpg')) {
                      target.src = `https://i.ytimg.com/vi/${vid.youtubeId}/hqdefault.jpg`;
                    }
                  }}
                />
              </div>
              <div className="record-caption">
                <strong>{vid.shortTitle}</strong>
                <span>{vid.client}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation Arrows & Counter */}
      <div className="record-navigation">
        <button type="button" aria-label="Previous music video" onClick={() => move(-1)}>
          <ChevronLeft size={18} />
        </button>
        <button type="button" aria-label="Next music video" onClick={() => move(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Player Bar */}
      <div className="music-player" aria-label="Playback controls">
        <div className="transport-controls">
          <button type="button" aria-label="Previous track" onClick={() => move(-1)}>
            <SkipBack size={20} fill="currentColor" />
          </button>
          <button
            type="button"
            className={`music-play ${activeZone === 'PLAY_BUTTON' ? 'is-focused' : ''}`}
            aria-label={isPlaying ? 'Pause Music Video' : 'Play Music Video'}
            onFocus={() => setZone('PLAY_BUTTON')}
            onClick={() => {
              if (currentVideo) {
                setIsPlaying((playing) => !playing);
              }
            }}
          >
            <Play size={22} fill="currentColor" />
          </button>
          <button type="button" aria-label="Next track" onClick={() => move(1)}>
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>

        <div
          className="now-playing cursor-pointer hover:bg-white/10 transition-colors"
          aria-live="polite"
          onClick={() => {
            if (currentVideo) {
              playActiveVideo(currentVideo.id);
            }
          }}
        >
          <img
            src={currentVideo ? getVideoArtwork(currentVideo) : ''}
            alt=""
            className="w-10 h-10 object-cover rounded-md"
            onError={(e) => {
              const target = e.currentTarget;
              if (currentVideo?.youtubeId && !target.src.includes('hqdefault.jpg')) {
                target.src = `https://i.ytimg.com/vi/${currentVideo.youtubeId}/hqdefault.jpg`;
              }
            }}
          />
          <div>
            <strong>{currentVideo?.shortTitle}</strong>
            <span>{currentVideo?.client} · {isPlaying ? 'Now playing' : 'Play visual'}</span>
          </div>
          <ExternalLink size={18} className="text-white/60 hover:text-white" />
        </div>
      </div>

      {/* Quick Shelf of All 24 Videos */}
      <div className="w-full max-w-5xl mt-10 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
            Browse All Releases ({videos.length})
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Click to focus · Double-click to play
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-6">
          {videos.map((vid, idx) => (
            <button
              key={vid.id}
              type="button"
              onClick={() => {
                playSound('focusTick');
                setMusicVideoIndex(idx);
                setZone('TILE_ROW');
              }}
              onDoubleClick={() => playActiveVideo(vid.id)}
              className={`group text-left p-2 rounded-xl transition-all border ${
                idx === currentIndex
                  ? 'bg-white/15 border-white ring-1 ring-white/50'
                  : 'bg-black/30 border-white/10 hover:border-white/40 hover:bg-white/5'
              }`}
            >
              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 mb-2">
                <img
                  src={getVideoArtwork(vid)}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (vid.youtubeId && !target.src.includes('hqdefault.jpg')) {
                      target.src = `https://i.ytimg.com/vi/${vid.youtubeId}/hqdefault.jpg`;
                    }
                  }}
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-white">
                  {vid.durationFormatted}
                </span>
              </div>
              <h4 className="font-['Outfit'] text-xs font-bold text-white truncate">
                {vid.shortTitle}
              </h4>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {vid.client}
              </p>
            </button>
          ))}
        </div>
      </div>

      <p className="music-footnote">
        <Music2 size={13} /> Direction · Lead Editing · Color Finishing by Director Menny
      </p>
    </section>
  );
}
