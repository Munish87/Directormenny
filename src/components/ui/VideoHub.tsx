import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ExternalLink,
  Share2,
  MoreHorizontal,
  ArrowLeft,
  Users,
  X,
} from 'lucide-react';
import { useDmStore } from '../../lib/store';
import { useSound } from '../../hooks/useSound';

export function VideoHub() {
  const selectedVideoId = useDmStore((s) => s.selectedVideoId);
  const videos = useDmStore((s) => s.videos);
  const activeZone = useDmStore((s) => s.activeZone);
  const hubActionIndex = useDmStore((s) => s.hubActionIndex);
  const hubCardIndex = useDmStore((s) => s.hubCardIndex);
  const isPlayingVideo = useDmStore((s) => s.isPlayingVideo);
  const closeVideoHub = useDmStore((s) => s.closeVideoHub);
  const setIsPlayingVideo = useDmStore((s) => s.setIsPlayingVideo);
  const setHubActionIndex = useDmStore((s) => s.setHubActionIndex);
  const setHubCardIndex = useDmStore((s) => s.setHubCardIndex);
  const openCardDetail = useDmStore((s) => s.openCardDetail);
  const { playSound } = useSound();

  const [shareCopied, setShareCopied] = useState(false);

  if (!selectedVideoId) return null;

  const video = videos.find((v) => v.id === selectedVideoId) || videos[0];
  if (!video) return null;

  const hubCards = [
    {
      id: 'credits',
      label: 'Official Activity',
      title: 'Credits',
      subtitle: video.credits.map((c) => `${c.role}: ${c.name}`).join(' · '),
      icon: Users,
      onSelect: () =>
        openCardDetail({
          title: `${video.shortTitle} — Production Credits`,
          kicker: video.client,
          body: `Full crew roster for ${video.title}.`,
          items: video.credits.map((c) => ({ label: c.role, value: c.name })),
        }),
    },
  ];

  const handleCopyShare = () => {
    playSound('select');
    const url = `https://www.youtube.com/watch?v=${video.youtubeId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2400);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSound('back');
          closeVideoHub();
        }
      }}
      className="relative z-20 flex flex-col justify-between h-[calc(100vh-76px)] px-10 md:px-16 pb-28 select-none overflow-y-auto no-scrollbar animate-fadeIn"
    >
      {/* Top Back Button */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => {
            playSound('back');
            closeVideoHub();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/45 hover:bg-white/15 border border-white/15 text-xs font-medium text-white/90 transition-all whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Bottom-Aligned PS5 Game Hub Content */}
      <div className="mt-auto space-y-7">
        <div className="flex flex-col items-start max-w-3xl">
          <p className="text-xs text-white/70 font-normal tracking-wide mb-1.5">
            {video.client} · {video.role} · {video.durationFormatted}
          </p>

          <h1 className="font-['Outfit'] text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white leading-[1.04] text-balance drop-shadow-[0_6px_28px_rgba(0,0,0,0.65)]">
            {video.shortTitle}
          </h1>

          <p className="mt-3 max-w-xl text-sm text-white/75 font-light leading-relaxed">
            {video.brief}
          </p>

          {/* PS5 Action Row: [Play] primary pill, [Watch on YouTube], [Share], [⋯ More] */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {/* 0: Play */}
            <button
              type="button"
              onMouseEnter={() => setHubActionIndex(0)}
              onClick={() => {
                playSound('select');
                setIsPlayingVideo(true);
              }}
              className={`px-14 py-3.5 rounded-full font-['Manrope'] text-base font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeZone === 'HUB_ACTIONS' && hubActionIndex === 0
                  ? 'bg-white text-black ring-4 ring-white/55 shadow-[0_0_34px_rgba(255,255,255,0.85)] scale-105'
                  : 'bg-white/90 text-black hover:bg-white'
              }`}
            >
              Play
            </button>

            {/* 1: Watch on YouTube */}
            <button
              type="button"
              onMouseEnter={() => setHubActionIndex(1)}
              onClick={() => {
                playSound('select');
                setIsPlayingVideo(true);
              }}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                activeZone === 'HUB_ACTIONS' && hubActionIndex === 1
                  ? 'bg-white text-black ring-2 ring-white shadow-[0_0_24px_rgba(255,255,255,0.6)] scale-105'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Watch on YouTube</span>
            </button>

            {/* 2: Share */}
            <button
              type="button"
              onMouseEnter={() => setHubActionIndex(2)}
              onClick={handleCopyShare}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                activeZone === 'HUB_ACTIONS' && hubActionIndex === 2
                  ? 'bg-white text-black ring-2 ring-white shadow-[0_0_24px_rgba(255,255,255,0.6)] scale-105'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>{shareCopied ? 'Copied' : 'Share'}</span>
            </button>

            {/* 3: More */}
            <button
              type="button"
              aria-label="More Options"
              onMouseEnter={() => setHubActionIndex(3)}
              onClick={() => {
                playSound('select');
                openCardDetail({
                  title: `${video.shortTitle} — Specification`,
                  kicker: video.client,
                  body: video.behindTheScenes,
                  items: [
                    { label: 'Director & Editor', value: 'Director Menny' },
                    { label: 'YouTube ID', value: video.youtubeId },
                    ...video.credits.map((c) => ({ label: c.role, value: c.name })),
                  ],
                });
              }}
              className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all shrink-0 ${
                activeZone === 'HUB_ACTIONS' && hubActionIndex === 3
                  ? 'bg-white text-black ring-2 ring-white shadow-[0_0_24px_rgba(255,255,255,0.6)] scale-105'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Activity Cards - Only Credits */}
        <div className="flex flex-wrap gap-3.5">
          {hubCards.map((card, idx) => {
            const Icon = card.icon;
            const isFocused = activeZone === 'HUB_CARDS' && hubCardIndex === idx;

            return (
              <button
                key={card.id}
                type="button"
                onMouseEnter={() => setHubCardIndex(idx)}
                onClick={() => {
                  playSound('select');
                  card.onSelect();
                }}
                className={`flex flex-col justify-between text-left p-4 rounded-[20px] bg-black/45 transition-all duration-200 focus:outline-none max-w-sm sm:max-w-md w-full ${
                  isFocused
                    ? 'border-[2px] border-white bg-black/65 shadow-[0_10px_28px_rgba(255,255,255,0.2)] -translate-y-1'
                    : 'border border-white/10 hover:border-white/25 hover:bg-black/55'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs text-white/55 font-normal">
                    {card.label}
                  </span>
                  <Icon className="w-4 h-4 text-white/55" />
                </div>
                <div>
                  <h3 className="font-['Outfit'] text-base font-medium text-white">
                    {card.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-white/55 line-clamp-2 leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cinematic Player Modal (youtube-nocookie iframe) */}
      {isPlayingVideo && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => {
            playSound('back');
            setIsPlayingVideo(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/92 p-4 md:p-8 animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(min(1150px, 92vw), calc((100dvh - 120px) * 16 / 9))' }}
            className="relative flex flex-col rounded-[22px] overflow-hidden bg-[#05070d] border border-white/20 shadow-[0_0_90px_rgba(0,0,0,0.95)] max-h-[calc(100dvh-40px)] cursor-default"
          >
            <div className="flex items-center justify-between px-5 py-3 bg-[#0b1120] border-b border-white/10 shrink-0">
              <h2 className="font-['Outfit'] text-sm md:text-base font-medium text-white truncate pr-4">
                {video.title}
              </h2>

              <button
                type="button"
                onClick={() => {
                  playSound('back');
                  setIsPlayingVideo(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0"
              >
                <X className="w-4 h-4" />
                <span>Close (ESC)</span>
              </button>
            </div>

            <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}?si=oVJ9660_BEWdxyMV&autoplay=1&rel=0&modestbranding=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                loading="eager"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
