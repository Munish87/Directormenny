import React, { useEffect, useState } from 'react';
import { useDmStore } from '../../lib/store';
import { getDirectorAvatarUri } from '../../lib/proceduralArt';
import { DmLogoMark, GlyphConfirm } from './GeometricGlyphs';
import { useSound } from '../../hooks/useSound';

export function BootSequence() {
  const bootPhase = useDmStore((s) => s.bootPhase);
  const setBootPhase = useDmStore((s) => s.setBootPhase);
  const skipOrCompleteBoot = useDmStore((s) => s.skipOrCompleteBoot);
  const { playSound } = useSound();
  const [bootProgress, setBootProgress] = useState(0);

  useEffect(() => {
    if (bootPhase !== 'boot') return;

    playSound('bootSwell');
    const t1 = window.setTimeout(() => setBootProgress(1), 250);
    const t2 = window.setTimeout(() => setBootProgress(2), 1400);
    const t3 = window.setTimeout(() => {
      setBootPhase('user_select');
    }, 3900);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [bootPhase, setBootPhase]);

  if (bootPhase === 'home') return null;

  const avatarUri = getDirectorAvatarUri();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070d]/95 text-white select-none overflow-hidden">
      {/* Ambient Radial Bloom */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: bootPhase === 'boot' ? (bootProgress >= 1 ? 0.85 : 0.15) : 0.9,
          background:
            'radial-gradient(circle at 50% 46%, rgba(59, 130, 246, 0.28) 0%, rgba(6, 182, 212, 0.08) 38%, rgba(5, 7, 13, 0.98) 72%)',
        }}
      />

      {bootPhase === 'boot' ? (
        <div
          onClick={() => {
            playSound('select');
            skipOrCompleteBoot();
          }}
          className="relative z-10 flex flex-col items-center justify-center cursor-pointer px-6 text-center"
        >
          {/* Particle Bloom + DM Emblem Materialization */}
          <div
            className={`relative flex items-center justify-center w-64 md:w-80 h-28 md:h-36 transition-all duration-1000 ${
              bootProgress >= 1
                ? 'scale-100 opacity-100 drop-shadow-[0_0_35px_rgba(59,130,246,0.9)]'
                : 'scale-75 opacity-0'
            }`}
          >
            <div className="absolute inset-0 rounded-full border border-blue-400/20 animate-ping opacity-25" />
            <img
              src="/images/dm-logo.png"
              alt="Director Menny Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_28px_rgba(59,130,246,0.9)]"
            />
          </div>

          <div
            className={`mt-8 transition-all duration-700 ${
              bootProgress >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <p className="font-['Outfit'] text-sm tracking-[0.32em] text-slate-300 uppercase">
              SPATIAL SYSTEM SOFTWARE
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playSound('select');
              skipOrCompleteBoot();
            }}
            className="mt-14 px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-slate-300 tracking-wider transition-all whitespace-nowrap shrink-0"
          >
            Skip Intro (Press Any Button)
          </button>
        </div>
      ) : (
        /* PS5 User Select Screen: "Who's using this controller?" */
        <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center animate-fadeIn">
          <p className="text-xs font-mono tracking-[0.25em] text-blue-400/90 mb-3">
            CONTROLLER 01 CONNECTED
          </p>
          <h1 className="font-['Outfit'] text-3xl md:text-4xl font-light tracking-tight text-white mb-12 text-balance">
            Who&apos;s using this controller?
          </h1>

          <button
            type="button"
            autoFocus
            onClick={() => {
              playSound('select');
              skipOrCompleteBoot();
            }}
            className="group relative flex flex-col items-center focus:outline-none"
          >
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full p-3 bg-[#060b16] border border-blue-400/40 shadow-[0_0_38px_rgba(59,130,246,0.55)] transition-transform duration-300 group-hover:scale-105 group-focus:scale-105 flex items-center justify-center">
              {/* Soft Glow Ring on Focus */}
              <div className="absolute -inset-1.5 rounded-full border-[3px] border-white shadow-[0_0_38px_rgba(59,130,246,0.85)] opacity-95 group-hover:opacity-100 transition-opacity" />
              <img
                src="/images/dm-logo.png"
                alt="Director Menny Profile Logo"
                className="w-4/5 h-4/5 object-contain filter drop-shadow-[0_0_16px_rgba(96,165,250,0.85)]"
              />
            </div>

            <span className="mt-6 font-['Outfit'] text-2xl font-medium tracking-tight text-white group-hover:text-blue-200 transition-colors">
              Director Menny
            </span>
            <span className="mt-1 text-xs text-slate-400 font-medium">
              Music Video Director · DOP · Editor · Colorist
            </span>

            <div className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-slate-950 font-semibold text-xs tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.35)] group-hover:bg-blue-50 transition-all whitespace-nowrap shrink-0">
              <GlyphConfirm className="w-4 h-4 text-slate-950" />
              <span>Sign In</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
