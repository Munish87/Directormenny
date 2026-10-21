import React from 'react';
import {
  Music,
  Volume2,
  VolumeX,
  Share2,
  User,
  Home,
  Mail,
  Instagram,
} from 'lucide-react';
import { useDmStore } from '../../lib/store';
import { AMBIENT_TRACKS, useSound } from '../../hooks/useSound';
import { getDirectorAvatarUri } from '../../lib/proceduralArt';
import creditsJson from '../../../content/credits.json';

export function ControlCenter() {
  const activeOverlay = useDmStore((s) => s.activeOverlay);
  const controlCenterIndex = useDmStore((s) => s.controlCenterIndex);
  const soundEnabled = useDmStore((s) => s.soundEnabled);
  const ambientPlaying = useDmStore((s) => s.ambientPlaying);
  const ambientTrackIndex = useDmStore((s) => s.ambientTrackIndex);
  const setControlCenterIndex = useDmStore((s) => s.setControlCenterIndex);
  const setActiveOverlay = useDmStore((s) => s.setActiveOverlay);
  const toggleSound = useDmStore((s) => s.toggleSound);
  const toggleAmbientPlaying = useDmStore((s) => s.toggleAmbientPlaying);
  const cycleAmbientTrack = useDmStore((s) => s.cycleAmbientTrack);
  const setBootPhase = useDmStore((s) => s.setBootPhase);
  const closeVideoHub = useDmStore((s) => s.closeVideoHub);
  const { playSound } = useSound();

  if (activeOverlay !== 'control_center') return null;

  const currentTrack = AMBIENT_TRACKS[ambientTrackIndex % AMBIENT_TRACKS.length];
  const socials = creditsJson.director.socials;
  const avatarUri = getDirectorAvatarUri();

  return (
    <div
      onClick={() => {
        playSound('back');
        setActiveOverlay('none');
      }}
      className="fixed inset-0 z-40 flex flex-col justify-end bg-black/75 px-8 md:px-16 pb-7 select-none animate-fadeIn"
    >
      {/* Authentic PS5 Control Center Floating Cards Row */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl mx-auto mb-7"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 0: Music / Now Playing */}
          <div
            onMouseEnter={() => setControlCenterIndex(0)}
            className={`flex flex-col justify-between p-5 rounded-[22px] bg-[#0d1322]/95 transition-all duration-200 ${
              controlCenterIndex === 0
                ? 'border-[2.5px] border-white shadow-[0_14px_38px_rgba(255,255,255,0.22)] -translate-y-1.5'
                : 'border border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-white/60 mb-4">
              <span>Music</span>
              <Music className="w-4 h-4 text-white/70" />
            </div>
            <div>
              <h3 className="font-['Outfit'] text-base font-medium text-white truncate">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-white/55 mt-0.5 truncate">
                {currentTrack.artist}
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playSound('select');
                  toggleAmbientPlaying();
                }}
                className="flex-1 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
              >
                {ambientPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('focusTick');
                  cycleAmbientTrack();
                }}
                className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* Card 1: Sound */}
          <div
            onMouseEnter={() => setControlCenterIndex(1)}
            className={`flex flex-col justify-between p-5 rounded-[22px] bg-[#0d1322]/95 transition-all duration-200 ${
              controlCenterIndex === 1
                ? 'border-[2.5px] border-white shadow-[0_14px_38px_rgba(255,255,255,0.22)] -translate-y-1.5'
                : 'border border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-white/60 mb-4">
              <span>Sound</span>
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-white/70" />
              ) : (
                <VolumeX className="w-4 h-4 text-white/70" />
              )}
            </div>
            <div>
              <h3 className="font-['Outfit'] text-base font-medium text-white">
                {soundEnabled ? 'Console Audio On' : 'Audio Muted'}
              </h3>
              <p className="text-xs text-white/55 mt-0.5">
                System UI &amp; ambient pad output
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleSound()}
              className="mt-5 w-full py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
            >
              {soundEnabled ? 'Mute' : 'Unmute'}
            </button>
          </div>

          {/* Card 2: Quick Links */}
          <div
            onMouseEnter={() => setControlCenterIndex(2)}
            className={`flex flex-col justify-between p-5 rounded-[22px] bg-[#0d1322]/95 transition-all duration-200 ${
              controlCenterIndex === 2
                ? 'border-[2.5px] border-white shadow-[0_14px_38px_rgba(255,255,255,0.22)] -translate-y-1.5'
                : 'border border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-white/60 mb-3">
              <span>Quick Links</span>
              <Share2 className="w-4 h-4 text-white/70" />
            </div>
            <div className="space-y-1 text-xs text-white/80">
              <a
                href={socials.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 py-1 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white rounded-sm"
              >
                <Instagram aria-hidden="true" className="w-4 h-4 stroke-[1.8]" />
                Instagram
              </a>
              <a
                href={`mailto:${socials.email}`}
                title={socials.email}
                className="flex items-center gap-2 py-1 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white rounded-sm"
              >
                <Mail aria-hidden="true" className="w-4 h-4 stroke-[1.8]" />
                Email
              </a>
            </div>
            <button
              type="button"
              onClick={() => {
                playSound('select');
                setActiveOverlay('contact');
              }}
              className="mt-4 w-full py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
            >
              Messages
            </button>
          </div>

          {/* Card 3: Profile */}
          <div
            onMouseEnter={() => setControlCenterIndex(3)}
            className={`flex flex-col justify-between p-5 rounded-[22px] bg-[#0d1322]/95 transition-all duration-200 ${
              controlCenterIndex === 3
                ? 'border-[2.5px] border-white shadow-[0_14px_38px_rgba(255,255,255,0.22)] -translate-y-1.5'
                : 'border border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-white/60 mb-4">
              <span>Profile</span>
              <User className="w-4 h-4 text-white/70" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#060b16] border border-blue-400/35 p-1.5 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.25)]">
                <img
                  src="/images/dm-logo.png"
                  alt="Director Menny"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-['Outfit'] text-base font-medium text-white truncate">
                  Director Menny
                </h3>
                <p className="text-xs text-emerald-400">Online</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playSound('select');
                setActiveOverlay('none');
                setBootPhase('user_select');
              }}
              className="mt-5 w-full py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
            >
              Switch User
            </button>
          </div>
        </div>
      </div>

      {/* Authentic PS5 Bottom Icon Bar (Minimal Circular Icon Row) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0d1322]/95 border border-white/15 shadow-[0_12px_45px_rgba(0,0,0,0.85)]"
      >
        <button
          type="button"
          title="Home"
          onClick={() => {
            playSound('select');
            closeVideoHub();
            setActiveOverlay('none');
          }}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-white text-black transition-transform hover:scale-105"
        >
          <Home className="w-5 h-5 stroke-[1.8]" />
        </button>





        <button
          type="button"
          title="Sound"
          onClick={() => toggleSound()}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 stroke-[1.8]" />
          ) : (
            <VolumeX className="w-5 h-5 stroke-[1.8]" />
          )}
        </button>

        <button
          type="button"
          title="Messages / Commission"
          onClick={() => {
            playSound('select');
            setActiveOverlay('contact');
          }}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Mail className="w-5 h-5 stroke-[1.8]" />
        </button>


        <button
          type="button"
          title="Director Menny Account"
          onClick={() => {
            playSound('select');
            setActiveOverlay('account');
          }}
          className="w-11 h-11 ml-1 rounded-full overflow-hidden ring-1 ring-blue-400/40 hover:ring-white transition-all bg-[#060b16] p-1.5 flex items-center justify-center"
        >
          <img
            src="/images/dm-logo.png"
            alt="Director Menny"
            className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(59,130,246,0.7)]"
          />
        </button>
      </div>
    </div>
  );
}
