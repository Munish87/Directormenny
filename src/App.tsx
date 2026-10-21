/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDmStore, getHomeVideos } from './lib/store';
import { useInput } from './hooks/useInput';
import { useVideos } from './hooks/useVideos';
import { useSound } from './hooks/useSound';
import { Scene } from './components/3d/Scene';
import { BootSequence } from './components/ui/BootSequence';
import { TopBar } from './components/ui/TopBar';
import { MusicView } from './components/ui/MusicView';
import { HomeView } from './components/ui/HomeView';
import { VideoHub } from './components/ui/VideoHub';
import { ArtGalleryView } from './components/ui/ArtGalleryView';
import { ControlCenter } from './components/ui/ControlCenter';
import { Overlays } from './components/ui/Overlays';
import { getVideoArtwork } from './lib/videoArtwork';
import { HintsBar } from './components/ui/HintsBar';

export default function App() {
  useInput();
  useVideos();
  useSound();

  const bootPhase = useDmStore((s) => s.bootPhase);
  const activeTab = useDmStore((s) => s.activeTab);
  const selectedVideoId = useDmStore((s) => s.selectedVideoId);
  const videos = useDmStore((s) => s.videos);
  const homeVideos = getHomeVideos(videos);
  const videoRowIndex = useDmStore((s) => s.videoRowIndex);
  const reducedMotion = useDmStore((s) => s.reducedMotion);
  const lowPower2D = useDmStore((s) => s.lowPower2D);
  const backdropVideo = videos.find(v => v.id === selectedVideoId) || homeVideos[videoRowIndex] || homeVideos[0] || videos[0];
  const artworks = useDmStore((s) => s.artworks);

  return (
    <div className="console-app relative w-full h-dvh overflow-hidden bg-[#05070d] text-white" data-motion={reducedMotion || lowPower2D ? 'still' : 'spatial'}
      onPointerMove={e => {
        if (reducedMotion || lowPower2D || activeTab === 'music' || e.pointerType !== 'mouse') return;
        e.currentTarget.style.setProperty('--pointer-x', `${(e.clientX / window.innerWidth - .5) * 2}`);
        e.currentTarget.style.setProperty('--pointer-y', `${(e.clientY / window.innerHeight - .5) * 2}`);
      }} onPointerLeave={e => { e.currentTarget.style.setProperty('--pointer-x', '0'); e.currentTarget.style.setProperty('--pointer-y', '0'); }}>
      {/* Hidden Semantic HTML List of Videos & Artworks for Search Engine Crawlers & Screen Readers */}
      <section className="sr-only" aria-label="Director Menny Filmography and AI Art Catalog">
        <h1>Director Menny — Film &amp; Music Video Director Portfolio</h1>
        <p>
          Official portfolio of Director Menny (Manish Parmar) — acclaimed Film Director, Music Video Director,
          and Creative Editor with over 100M+ views across cinematic projects.
        </p>
        <address>
          <p>Email: <a href="mailto:manish.parmar1995@gmail.com">manish.parmar1995@gmail.com</a></p>
          <p>Instagram: <a href="https://instagram.com/menny_parmar">@menny_parmar</a></p>
        </address>
        <h2>Directed &amp; Edited Music Videos</h2>
        <ul>
          {videos.map((v) => (
            <li key={v.id}>
              <h3>{v.title}</h3>
              <p>
                Client: {v.client} · Role: {v.role} · Duration: {v.durationFormatted} · Views:{' '}
                {v.views}
              </p>
              <p>{v.brief}</p>
            </li>
          ))}
        </ul>
        <h2>AI Spatial Concept Art Gallery</h2>
        <ul>
          {artworks.map((a) => (
            <li key={a.id}>
              <h3>{a.title}</h3>
              <p>
                Category: {a.category} · Tool: {a.tool} · Prompt: {a.promptSummary}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Persistent 3D WebGL Scene (GLSL Wave Shader + Particle Field + Camera Rig) */}
      {bootPhase === 'home' && (activeTab === 'videos' || selectedVideoId) && backdropVideo && <div className="console-backdrop" aria-hidden="true"><img key={backdropVideo.id} src={getVideoArtwork(backdropVideo)} alt="" /></div>}
      <Scene />

      {/* Boot + Controller User Select Sequence */}
      <BootSequence />

      {/* Main Console Shell */}
      {bootPhase === 'home' && (
        <main className="relative z-10 flex flex-col w-full h-full">
          <TopBar />

          {selectedVideoId ? (
            <VideoHub />
          ) : activeTab === 'music' ? (
            <MusicView />
          ) : activeTab === 'videos' ? (
            <HomeView />
          ) : (
            <ArtGalleryView />
          )}

          <ControlCenter />
          <Overlays />
          <HintsBar />
        </main>
      )}
    </div>
  );
}
