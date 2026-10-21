import React from 'react';
import { Home, Music2, Images, UserRound } from 'lucide-react';
import { useDmStore, type PrimaryTab, type OverlayType } from '../../lib/store';
import { useSound } from '../../hooks/useSound';

const destinations: { label: string; icon: typeof Home; tab?: PrimaryTab; overlay?: OverlayType }[] = [
  { label: 'Videos', icon: Home, tab: 'videos' },
  { label: 'Music', icon: Music2, tab: 'music' },
  { label: 'AI Art', icon: Images, tab: 'ai_art' },
  { label: 'Profile', icon: UserRound, overlay: 'account' },
];

export function HintsBar() {
  const s = useDmStore();
  const { playSound } = useSound();
  if (s.bootPhase !== 'home') return null;
  return <footer className="console-dock-wrap"><nav className="console-dock" aria-label="Console navigation"
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); e.stopPropagation();
        const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[Math.max(0, Math.min(buttons.length - 1, current + (e.key === 'ArrowRight' ? 1 : -1)))]?.focus();
      }
    }}>
    {destinations.map((item, index) => <button type="button" key={item.label} aria-label={item.label} title={item.label}
      aria-current={item.tab === s.activeTab && !s.selectedVideoId && s.activeOverlay === 'none' ? 'page' : undefined}
      className={`dock-button ${item.tab === s.activeTab && !s.selectedVideoId ? 'is-active' : ''} ${s.activeZone === 'TOP_BAR' && s.topBarIndex === index ? 'is-focused' : ''}`}
      onFocus={() => s.setTopBarIndex(index)} onClick={() => {
        playSound('tabSwitch');
        if (item.tab) { s.setActiveOverlay('none'); s.setActiveTab(item.tab); }
        else if (item.overlay) s.setActiveOverlay(item.overlay);
      }}><item.icon size={20} strokeWidth={1.6} /><span className="dock-tooltip" aria-hidden="true">{item.label}</span></button>)}
  </nav></footer>;
}
