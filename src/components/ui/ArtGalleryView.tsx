import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Share2,
  X,
  Instagram,
} from 'lucide-react';
import { ART_CATEGORIES, useDmStore } from '../../lib/store';
import { getArtworkDataUri } from '../../lib/proceduralArt';
import { useSound } from '../../hooks/useSound';
import { usePhonePerformance } from '../../hooks/usePhonePerformance';
import { InstagramReel } from './InstagramReel';

export function ArtGalleryView() {
  const phonePerformance = usePhonePerformance();
  const artworks = useDmStore((s) => s.artworks);
  const selectedArtCategory = useDmStore((s) => s.selectedArtCategory);
  const filterBarIndex = useDmStore((s) => s.filterBarIndex);
  const artRowIndex = useDmStore((s) => s.artRowIndex);
  const activeZone = useDmStore((s) => s.activeZone);
  const selectedArtId = useDmStore((s) => s.selectedArtId);
  const setFilterCategory = useDmStore((s) => s.setFilterCategory);
  const setArtRowIndex = useDmStore((s) => s.setArtRowIndex);
  const setActiveZone = useDmStore((s) => s.setActiveZone);
  const openArtViewer = useDmStore((s) => s.openArtViewer);
  const closeArtViewer = useDmStore((s) => s.closeArtViewer);
  const { playSound } = useSound();

  const rowRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useDmStore((s) => s.reducedMotion);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [failedVideoId, setFailedVideoId] = useState<string | null>(null);
  const [failedHeroVideoId, setFailedHeroVideoId] = useState<string | null>(null);

  const filteredArtworks =
    selectedArtCategory === 'All'
      ? artworks
      : artworks.filter((a) => a.category === selectedArtCategory);

  const focusedArt = filteredArtworks[artRowIndex] || filteredArtworks[0];
  const viewerArt =
    artworks.find((a) => a.id === selectedArtId) || focusedArt;

  useEffect(() => {
    const row = rowRef.current;
    const tile = row?.children[artRowIndex] as HTMLElement | undefined;
    if (row && tile) {
      row.scrollTo({
        left: Math.max(0, tile.offsetLeft - row.offsetLeft - 10),
        behavior: reducedMotion ? 'instant' : 'smooth',
      });
    }
  }, [artRowIndex, selectedArtCategory, reducedMotion]);

  if (!focusedArt) return null;

  const focusedThumb =
    focusedArt.thumbnailUrl ||
    getArtworkDataUri(
      focusedArt.visualPreset,
      focusedArt.dominantColor,
      focusedArt.secondaryColor,
      focusedArt.title
    );

  const handleShareArt = (artId: string) => {
    playSound('select');
    const art = artworks.find((a) => a.id === artId);
    const link = art?.instagramUrl || `${window.location.origin}/?art=${artId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setCopiedId(artId);
    window.setTimeout(() => setCopiedId(null), 2200);
  };

  const viewArt = () => {
    playSound('select');
    openArtViewer(focusedArt.id);
  };

  return (
    <div className="art-gallery no-scrollbar">
      <nav className="art-filters no-scrollbar" aria-label="Artwork categories">
        {ART_CATEGORIES.map((category, index) => (
          <button
            type="button"
            key={category}
            aria-pressed={selectedArtCategory === category}
            className={`${selectedArtCategory === category ? 'is-active' : ''} ${
              activeZone === 'FILTER_BAR' && filterBarIndex === index ? 'is-focused' : ''
            }`}
            onClick={() => {
              playSound('tabSwitch');
              setFilterCategory(category, index);
              setActiveZone('FILTER_BAR');
            }}
          >
            {category}
          </button>
        ))}
      </nav>

      <section className="art-showcase" aria-label="Selected artwork">
        <div className="art-info">
          <span className="eyebrow">DIRECTOR MENNY / AI SPATIAL CONCEPT ART</span>
          <h1>{focusedArt.title}</h1>
          <p className="art-category">{focusedArt.category}</p>
          {focusedArt.promptSummary ? (
            <p className="art-description">{focusedArt.promptSummary}</p>
          ) : null}

          <div className="art-actions">
            <button
              type="button"
              className={`console-play ${activeZone === 'PLAY_BUTTON' ? 'is-focused' : ''}`}
              onFocus={() => setActiveZone('PLAY_BUTTON')}
              onClick={viewArt}
            >
              <Play size={17} fill="currentColor" />
              <span>{focusedArt.videoUrl || focusedArt.mediaType === 'reel' ? 'Watch Reel' : 'View Artwork'}</span>
            </button>

            {focusedArt.instagramUrl && (
              <a
                href={focusedArt.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all hover:scale-105"
              >
                <Instagram size={15} />
                <span>Instagram</span>
                <ExternalLink size={13} className="text-white/60" />
              </a>
            )}

            <button
              type="button"
              className="art-share"
              aria-label="Share artwork"
              onClick={() => handleShareArt(focusedArt.id)}
            >
              <Share2 size={17} />
              <span>{copiedId === focusedArt.id ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          className="art-frame group cursor-pointer relative overflow-hidden"
          aria-label={`View ${focusedArt.title}`}
          onClick={viewArt}
        >
          {focusedArt.videoUrl && !phonePerformance && failedHeroVideoId !== focusedArt.id ? (
            <video
              key={focusedArt.id}
              src={focusedArt.videoUrl}
              poster={focusedThumb}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setFailedHeroVideoId(focusedArt.id)}
              className="w-full h-full object-contain rounded-[14px] bg-black"
            />
          ) : (
            <img
              key={focusedArt.id}
              src={focusedThumb}
              alt={focusedArt.title}
              className="w-full h-full object-cover rounded-[14px]"
            />
          )}
          <span className="art-frame-caption flex items-center justify-between pointer-events-none">
            <span className="text-xs font-mono font-bold tracking-wide drop-shadow-md">
              {focusedArt.category} · {focusedArt.videoUrl || focusedArt.mediaType === 'reel' ? 'PLAY REEL' : 'VIEW ART'}
            </span>
            <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <Play size={14} fill="currentColor" />
            </span>
          </span>
        </button>
      </section>

      <section className="art-collection" aria-label="Browse artwork">
        <div className="art-collection-label">
          <h2>Explore the collection</h2>
          <span>{filteredArtworks.length} works</span>
        </div>
        <div ref={rowRef} className="console-carousel art-carousel no-scrollbar">
          {filteredArtworks.map((art, index) => {
            const thumb =
              art.thumbnailUrl ||
              getArtworkDataUri(
                art.visualPreset,
                art.dominantColor,
                art.secondaryColor,
                art.title
              );
            return (
              <button
                type="button"
                key={art.id}
                aria-label={`Select ${art.title}`}
                aria-pressed={artRowIndex === index}
                className={`console-tile ${artRowIndex === index ? 'is-selected' : ''}`}
                style={
                  {
                    '--tile-depth': Math.min(Math.abs(index - artRowIndex), 3),
                  } as React.CSSProperties
                }
                onFocus={() => setArtRowIndex(index)}
                onClick={() => {
                  playSound('focusTick');
                  setArtRowIndex(index);
                }}
                onDoubleClick={() => {
                  setArtRowIndex(index);
                  openArtViewer(art.id);
                }}
              >
                <img
                  src={thumb}
                  alt={art.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <span>{art.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Full-Screen Interactive Reel & Art Lightbox Viewer */}
      {selectedArtId && viewerArt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Artwork viewer"
          className="art-viewer fixed inset-0 z-50 flex flex-col justify-between bg-[#05070d]/96 p-4 md:p-8 animate-fadeIn select-none"
        >
          <div className="art-viewer-toolbar relative z-10 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono tracking-widest text-blue-400 block">
                AI SPATIAL ART · {viewerArt.category.toUpperCase()}
              </span>
              <h2 className="text-sm md:text-base font-['Outfit'] font-bold text-white mt-0.5">
                {viewerArt.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {viewerArt.instagramUrl && (
                <a
                  href={viewerArt.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <span>Open on Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/60" />
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  playSound('back');
                  closeArtViewer();
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                <X className="w-4 h-4" />
                <span>Close (ESC)</span>
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 my-3 flex items-center justify-center overflow-hidden rounded-[24px] border border-white/15 bg-black/95 p-2 md:p-4">
            {viewerArt.videoUrl && failedVideoId !== viewerArt.id ? (
              <div className="absolute inset-2 md:inset-4 flex items-center justify-center bg-black">
                <video
                  key={viewerArt.id}
                  src={viewerArt.videoUrl}
                  poster={viewerArt.thumbnailUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  onError={() => setFailedVideoId(viewerArt.id)}
                  className="w-full h-full object-contain rounded-2xl bg-black"
                />
              </div>
            ) : viewerArt.instagramUrl ? (
              <InstagramReel
                key={viewerArt.id}
                url={viewerArt.instagramUrl}
                title={viewerArt.title}
              />
            ) : (
              <div className="relative w-full h-full max-w-3xl max-h-[80vh] flex items-center justify-center">
                <img
                  src={
                    viewerArt.thumbnailUrl ||
                    getArtworkDataUri(
                      viewerArt.visualPreset,
                      viewerArt.dominantColor,
                      viewerArt.secondaryColor,
                      viewerArt.title
                    )
                  }
                  alt={viewerArt.title}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
                />
              </div>
            )}

            {artRowIndex > 0 && (
              <button
                type="button"
                onClick={() => {
                  playSound('focusTick');
                  const prev = filteredArtworks[artRowIndex - 1];
                  if (prev) {
                    setArtRowIndex(artRowIndex - 1);
                    openArtViewer(prev.id);
                  }
                }}
                className="absolute left-4 p-3 rounded-full bg-black/70 hover:bg-white text-white hover:text-black border border-white/20 transition-all shadow-xl"
                aria-label="Previous Artwork"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {artRowIndex < filteredArtworks.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  playSound('focusTick');
                  const next = filteredArtworks[artRowIndex + 1];
                  if (next) {
                    setArtRowIndex(artRowIndex + 1);
                    openArtViewer(next.id);
                  }
                }}
                className="absolute right-4 p-3 rounded-full bg-black/70 hover:bg-white text-white hover:text-black border border-white/20 transition-all shadow-xl"
                aria-label="Next Artwork"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 rounded-[20px] bg-black/60 border border-white/10 backdrop-blur-md">
            <div className="max-w-3xl">
              <p className="text-xs text-white/60">
                {viewerArt.tags.join(' · ')}
              </p>
              {viewerArt.promptSummary ? (
                <p className="text-sm text-white/90 font-light leading-relaxed mt-1">
                  {viewerArt.promptSummary}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => handleShareArt(viewerArt.id)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all whitespace-nowrap shrink-0"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedId === viewerArt.id ? 'Copied Link' : 'Share Reel'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
