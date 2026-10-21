import React, { useRef, useEffect } from 'react';
import { LayoutGrid, Clapperboard, Play, ArrowUpRight } from 'lucide-react';
import { useDmStore, getHomeVideos } from '../../lib/store';
import { getVideoArtwork } from '../../lib/videoArtwork';
import { useSound } from '../../hooks/useSound';

export function HomeView() {
  const s = useDmStore();
  const { playSound } = useSound();
  const row = useRef<HTMLDivElement>(null);
  const homeVideos = getHomeVideos(s.videos);
  const video = homeVideos[s.videoRowIndex] || homeVideos[0];
  const library = s.videoRowIndex === homeVideos.length;
  const services = s.videoRowIndex === homeVideos.length + 1;
  useEffect(() => {
    const tile = row.current?.children[s.videoRowIndex] as HTMLElement | undefined;
    if (tile && row.current) row.current.scrollTo({ left: Math.max(0, tile.offsetLeft - row.current.offsetLeft + tile.offsetWidth / 2 - row.current.clientWidth / 2), behavior: s.reducedMotion ? 'instant' : 'smooth' });
  }, [s.videoRowIndex, s.reducedMotion]);
  if (!video) return null;
  const activate = () => {
    playSound('select');
    if (library) s.setActiveOverlay('library');
    else if (services) s.setActiveOverlay('services');
    else {
      s.openVideoHub(video.id);
      s.setIsPlayingVideo(true);
    }
  };
  return <div className="console-home cinematic-home no-scrollbar">
    <section className="cinematic-caption" aria-label="Selected release">
      <p className="eyebrow"><span />DIRECTOR MENNY / SELECTED WORK</p>
      <h1>{library ? 'The collection.' : services ? 'Create something.' : video.shortTitle}</h1>
      <div className="cinematic-meta"><span>{library ? 'Explore every film' : services ? 'Music video editing · Packages' : video.client.split(/\s*(?:·|\/\/)\s*/)[0]}</span>{!library && !services && <><i />{video.durationFormatted}</>}</div>
    </section>
    <section className="cinematic-library" aria-label="Browse videos">
      <div ref={row} className="console-carousel cinematic-covers no-scrollbar">
        {homeVideos.map((item, index) => <button type="button" key={item.id} aria-label={`Select ${item.shortTitle}`} aria-pressed={s.videoRowIndex === index}
          className={`console-tile ${s.videoRowIndex === index ? 'is-selected' : ''}`}
          style={{ '--tile-depth': Math.min(Math.abs(index - s.videoRowIndex), 3) } as React.CSSProperties}
          onClick={() => { playSound('focusTick'); s.setVideoRowIndex(index); }} onFocus={() => s.setVideoRowIndex(index)}
          onDoubleClick={() => s.openVideoHub(item.id)}>
          <img
            src={getVideoArtwork(item)}
            alt={item.title}
            className="w-full h-full object-cover object-center block"
            loading="eager"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (item.youtubeId && !target.src.includes('hqdefault')) {
                target.src = `https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`;
              }
            }}
          />
          <span>{item.shortTitle}</span>
          <small>{s.videoRowIndex === index ? 'SELECTED' : 'DM ORIGINAL'}</small>
        </button>)}
        {[{ label: 'Library', icon: LayoutGrid }, { label: 'Services', icon: Clapperboard }].map((item, index) => <button type="button" key={item.label} aria-label={item.label} className={`console-tile utility-tile ${s.videoRowIndex === homeVideos.length + index ? 'is-selected' : ''}`} onFocus={() => s.setVideoRowIndex(homeVideos.length + index)} onClick={() => { s.setVideoRowIndex(homeVideos.length + index); s.setActiveOverlay(index ? 'services' : 'library'); }}><item.icon size={27} strokeWidth={1.3} /><span>{item.label}</span></button>)}
      </div>
      <div className="cinematic-actions"><button type="button" className={`cinematic-play ${s.activeZone === 'PLAY_BUTTON' ? 'is-focused' : ''}`} onFocus={() => s.setActiveZone('PLAY_BUTTON')} onClick={activate}>{library || services ? <ArrowUpRight size={15} /> : <Play size={13} fill="currentColor" />}<span>{library ? 'Explore library' : services ? 'View services' : 'Watch film'}</span></button><span className="collection-count">{String(s.videoRowIndex + 1).padStart(2, '0')} <i>/</i> {String(homeVideos.length + 2).padStart(2, '0')}</span></div>
    </section>
  </div>;
}
