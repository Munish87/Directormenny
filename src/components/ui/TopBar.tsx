import React, { useEffect, useState } from 'react';
import { Instagram } from 'lucide-react';
import { DmLogoMark } from './GeometricGlyphs';
import { useDmStore } from '../../lib/store';
import creditsJson from '../../../content/credits.json';

export function TopBar() {
  const activeTab = useDmStore(s => s.activeTab);
  const setActiveTab = useDmStore(s => s.setActiveTab);
  const setActiveOverlay = useDmStore(s => s.setActiveOverlay);
  const closeVideoHub = useDmStore(s => s.closeVideoHub);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 10000); return () => clearInterval(timer); }, []);
  return <header className="minimal-topbar">
    <div className="minimal-brand">
      <button
        type="button"
        aria-label="Director Menny — Home"
        className="rounded-sm"
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
        }}
        onClick={() => {
          closeVideoHub();
          setActiveOverlay('none');
          setActiveTab('videos');
        }}
      >
        <DmLogoMark className="h-10 sm:h-12 md:h-[50px] w-auto max-w-[220px]" />
      </button>
      <i />
      <small>{activeTab === 'videos' ? 'HOME' : activeTab === 'music' ? 'MUSIC' : 'AI ART'}</small>
    </div>
    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
      <a
        href={creditsJson.director.socials.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit Menny on Instagram (opens in a new tab)"
        title="Instagram · @menny_parmar"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#d1dbe8] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Instagram aria-hidden="true" className="h-5 w-5 stroke-[1.8]" />
      </a>
      <time dateTime={now.toISOString()}>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
    </div>
  </header>;
}
