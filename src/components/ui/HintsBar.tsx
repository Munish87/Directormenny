import React from 'react';
import { Home, Music2, Sparkles, UserRound } from 'lucide-react';
import { useDmStore, type PrimaryTab, type OverlayType } from '../../lib/store';
import { useSound } from '../../hooks/useSound';

const destinations: { label: string; icon: typeof Home; tab?: PrimaryTab; overlay?: OverlayType }[] = [
  { label: 'Videos', icon: Home, tab: 'videos' },
  { label: 'Music', icon: Music2, tab: 'music' },
  { label: 'AI Art', icon: Sparkles, tab: 'ai_art' },
  { label: 'Profile', icon: UserRound, overlay: 'account' },
];

export function HintsBar() {
  const s = useDmStore();
  const { playSound } = useSound();

  if (s.bootPhase !== 'home') return null;

  return (
    <footer className="console-dock-wrap" role="contentinfo" aria-label="Console navigation and portfolio footer">
      {/* Left: Brand Identity & Live Commission Status */}
      <div className="footer-meta-left hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" aria-hidden="true" />
          <span className="font-['Outfit'] font-semibold text-[11px] tracking-[2.5px] text-white/95">DIRECTOR MENNY</span>
        </div>
        <span className="text-white/20 text-xs" aria-hidden="true">/</span>
        <span className="text-[10px] tracking-[1.8px] text-[#91a6c4] font-medium uppercase">AVAILABLE ONLY ON EARTH</span>
      </div>

      {/* Center: Iconic PS5 Console Dock */}
      <nav
        className="console-dock"
        aria-label="Console navigation"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();
            const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
            const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
            buttons[Math.max(0, Math.min(buttons.length - 1, current + (e.key === 'ArrowRight' ? 1 : -1)))]?.focus();
          }
        }}
      >
        {destinations.map((item, index) => (
          <button
            type="button"
            key={item.label}
            aria-label={item.label}
            title={item.label}
            aria-current={item.tab === s.activeTab && !s.selectedVideoId && s.activeOverlay === 'none' ? 'page' : undefined}
            className={`dock-button ${item.tab === s.activeTab && !s.selectedVideoId && s.activeOverlay === 'none' ? 'is-active' : ''} ${s.activeZone === 'TOP_BAR' && s.topBarIndex === index ? 'is-focused' : ''}`}
            onFocus={() => s.setTopBarIndex(index)}
            onClick={() => {
              playSound('tabSwitch');
              if (item.tab) {
                s.setActiveOverlay('none');
                s.setActiveTab(item.tab);
              } else if (item.overlay) {
                s.setActiveOverlay(item.overlay);
              }
            }}
          >
            <item.icon size={20} strokeWidth={1.6} />
            <span className="dock-tooltip" aria-hidden="true">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Right: Balanced Spacer so dock stays 100% centered */}
      <div className="footer-meta-right hidden md:flex items-center" aria-hidden="true" />

      {/* Mobile Sub-line: subtle brand + status */}
      <div className="footer-mobile-sub flex md:hidden items-center justify-center gap-2 text-[10px] text-[#8aa1be] tracking-wider mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" aria-hidden="true" />
        <span>DIRECTOR MENNY</span>
        <span className="text-white/20" aria-hidden="true">·</span>
        <span>AVAILABLE ONLY ON EARTH</span>
      </div>
    </footer>
  );
}
