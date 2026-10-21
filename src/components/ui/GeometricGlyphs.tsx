import React from 'react';
import { TrophyTier } from '../../lib/schemas';

export function DmLogoMark({ className = 'h-10 sm:h-12 w-auto' }: { className?: string }) {
  return (
    <img
      src="/images/dm-logo.png"
      alt="Director Menny Logo"
      className={`object-contain filter drop-shadow-[0_0_12px_rgba(59,130,246,0.7)] ${className}`}
    />
  );
}

/**
 * Original geometric button icons (non-Sony, custom architectural console glyphs)
 */
export function GlyphConfirm({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        x="12"
        y="2.5"
        width="13.4"
        height="13.4"
        rx="2"
        transform="rotate(45 12 2.5)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function GlyphBack({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon
        points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M9.5 12H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function GlyphOptions({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points="12,4 20,19 4,19" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function GlyphGuide({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function TrophyBadgeSvg({
  tier,
  unlocked = true,
  className = 'w-10 h-10',
}: {
  tier: Exclude<TrophyTier, 'none'>;
  unlocked?: boolean;
  className?: string;
}) {
  const colors: Record<
    Exclude<TrophyTier, 'none'>,
    { primary: string; secondary: string; glow: string }
  > = {
    bronze: { primary: '#d97706', secondary: '#92400e', glow: '#f59e0b' },
    silver: { primary: '#e2e8f0', secondary: '#64748b', glow: '#f8fafc' },
    gold: { primary: '#facc15', secondary: '#ca8a04', glow: '#fef08a' },
    platinum: { primary: '#38bdf8', secondary: '#6366f1', glow: '#e0f2fe' },
  };

  const c = unlocked
    ? colors[tier]
    : { primary: '#334155', secondary: '#1e293b', glow: '#475569' };

  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`grad-${tier}-${unlocked}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.glow} />
          <stop offset="50%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      {/* Outer Octagonal Console Shield */}
      <polygon
        points="32,4 52,12 60,32 52,52 32,60 12,52 4,32 12,12"
        fill="#090d16"
        stroke={`url(#grad-${tier}-${unlocked})`}
        strokeWidth="2.5"
      />
      {/* Sculpted Geometric Chalice / Spire */}
      <path
        d="M20 18H44L39 36C38 40 35 42 32 42C29 42 26 40 25 36L20 18Z"
        fill={`url(#grad-${tier}-${unlocked})`}
        opacity={unlocked ? 0.95 : 0.35}
      />
      <rect
        x="29"
        y="42"
        width="6"
        height="7"
        fill={c.primary}
        opacity={unlocked ? 0.9 : 0.3}
      />
      <rect
        x="22"
        y="49"
        width="20"
        height="4"
        rx="2"
        fill={`url(#grad-${tier}-${unlocked})`}
        opacity={unlocked ? 0.95 : 0.35}
      />
      {tier === 'platinum' && unlocked && (
        <circle cx="32" cy="27" r="4" fill="#ffffff" />
      )}
    </svg>
  );
}
