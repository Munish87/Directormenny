import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Check,
  Send,
  Play,
  Award,
  ExternalLink,
  Film,
  Camera,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Palette,
  Instagram,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { useDmStore } from '../../lib/store';
import { getArtworkDataUri, getDirectorAvatarUri } from '../../lib/proceduralArt';
import { getVideoArtwork } from '../../lib/videoArtwork';
import { useSound } from '../../hooks/useSound';
import creditsJson from '../../../content/credits.json';
import { servicePackages } from '../../lib/servicePackages';

export function Overlays() {
  const activeOverlay = useDmStore((s) => s.activeOverlay);
  const setActiveOverlay = useDmStore((s) => s.setActiveOverlay);
  const setActiveTab = useDmStore((s) => s.setActiveTab);
  const videos = useDmStore((s) => s.videos);
  const openVideoHub = useDmStore((s) => s.openVideoHub);
  const activeCardDetail = useDmStore((s) => s.activeCardDetail);

  const { playSound } = useSound();

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    artistOrLabel: '',
    serviceType: 'General Inquiry',
    budgetRange: '',
    message: '',
    honeypot: '',
  });
  const [contactStatus, setContactStatus] = useState<{
    loading: boolean;
    error: string | null;
    referenceId: string | null;
  }>({ loading: false, error: null, referenceId: null });

  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0 });
    if (activeOverlay === 'contact') {
      dialogRef.current?.querySelector<HTMLInputElement>('#booking-name')?.focus({ preventScroll: true });
    }
  }, [activeOverlay]);

  if (activeOverlay === 'none' || activeOverlay === 'control_center') {
    return null;
  }

  const closeOverlay = () => {
    playSound('back');
    setActiveOverlay('none');
  };

  const director = creditsJson.director;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('select');
    setContactStatus({ loading: true, error: null, referenceId: null });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setContactStatus({
          loading: false,
          error: data.error || 'Could not dispatch message. Check fields.',
          referenceId: null,
        });
        return;
      }
      setContactStatus({
        loading: false,
        error: null,
        referenceId: data.referenceId,
      });
    } catch {
      setContactStatus({
        loading: false,
        error: 'Network error while dispatching message.',
        referenceId: null,
      });
    }
  };

  return (
    <div
      onClick={closeOverlay}
      className="portfolio-overlay fixed inset-0 z-40 flex items-center justify-center bg-[#05070d]/90 p-4 md:p-10 select-none animate-fadeIn overflow-y-auto"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={activeOverlay === 'contact' ? 'Book Director Menny' : activeOverlay === 'account' ? 'Director Menny profile' : 'Portfolio details'}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={e => { if (e.key !== 'Escape') e.stopPropagation(); }}
        className={`portfolio-dialog no-scrollbar ${activeOverlay === 'contact' ? 'booking-dialog' : ''}`}
      >
        {/* Common Header Close Button */}
        <button
          type="button"
          onClick={closeOverlay}
          className="portfolio-dialog-close" aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
          <span>Back (ESC)</span>
        </button>

        {activeOverlay === 'account' && (
          <section className="director-profile">
            {/* Top Verified Creative Profile Banner */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-300 font-mono text-[11px] tracking-wider w-max shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>{director.verifiedBanner}</span>
            </div>

            {/* Profile Header */}
            <div className="director-profile-header">
              <div className="director-profile-logo-box">
                <img src="/images/dm-logo.png" alt={director.name} />
              </div>
              <div>
                <h2>{director.name}</h2>
                <p>{director.subtitle}</p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="director-profile-actions">
              <button
                type="button"
                className="booking-primary"
                onClick={() => {
                  playSound('select');
                  setActiveOverlay('contact');
                }}
              >
                {director.primaryButton}
              </button>
              <button
                type="button"
                className="booking-secondary"
                onClick={() => {
                  playSound('select');
                  setActiveOverlay('library');
                }}
              >
                {director.secondaryButton}
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="director-stats">
              {Object.values(director.stats).map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                  <small>{stat.sub}</small>
                </div>
              ))}
            </div>

            {/* 1. Biography: BEHIND THE VISION */}
            <section className="director-panel">
              <h3>{director.biography.heading}</h3>
              <div className="space-y-3">
                {director.biography.paragraphs.map((p) => (
                  <p key={p} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
              <blockquote>"{director.biography.closingQuote}"</blockquote>
            </section>



            {/* Booking & Vision Call-to-Action Banner */}
            <section className="director-booking-cta">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-blue-400 uppercase mb-1">
                  {director.contact.heading}
                </p>
                <h3>{director.servicesSection.ctaHeadline}</h3>
                <p>{director.servicesSection.ctaSub}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="booking-primary"
                  onClick={() => {
                    playSound('select');
                    setActiveOverlay('contact');
                  }}
                >
                  {director.primaryButton}
                </button>
                <button
                  type="button"
                  className="booking-secondary"
                  onClick={() => {
                    playSound('select');
                    setActiveOverlay('library');
                  }}
                >
                  {director.secondaryButton}
                </button>
              </div>
            </section>
          </section>
        )}

        {activeOverlay === 'services' && (
          <section className="director-profile">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 font-mono text-[11px] tracking-wider w-max">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>{director.verifiedBanner}</span>
              </div>
              <img
                src="/images/dm-logo.png"
                alt="Director Menny Logo"
                className="h-9 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.6)] hidden sm:block"
              />
            </div>
            <div>
              <p className="eyebrow">DIRECTOR MENNY / SERVICES</p>
              <h2 className="booking-title">YOUR SOUND. YOUR STORY.</h2>
              <p className="booking-intro">Music video editing for your next release. Choose a single video, a monthly package or a personalised order. Prices in USD.</p>
            </div>
            <div className="service-pricing-grid">
              {servicePackages.map((plan, index) => (
                <article key={plan.id} className={`service-pricing-card ${plan.id === 'monthly' ? 'is-featured' : ''}`}>
                  <div className="service-plan-number">MUSIC VIDEO EDITING</div>
                  <h3>{plan.name}</h3>
                  <p className="service-plan-price">{plan.price}<span>{plan.period}</span></p>
                  <p className="service-plan-description">{plan.description}</p>
                  <p className="service-plan-detail"><Check size={16} aria-hidden="true" />{plan.detail}</p>
                  {plan.inclusions.length > 0 && (
                    <ul className="space-y-3 text-xs leading-relaxed text-[#e0edff]">
                      {plan.inclusions.map((inclusion) => (
                        <li key={inclusion} className="flex items-start gap-2">
                          <Check size={16} aria-hidden="true" className="shrink-0 mt-0.5 text-[#a5cdff]" />
                          <span>{inclusion}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="booking-primary"
                    onClick={() => {
                      playSound('select');
                      setContactStatus({ loading: false, error: null, referenceId: null });
                      setContactForm((prev) => ({ ...prev, serviceType: plan.name, budgetRange: plan.budget }));
                      setActiveOverlay('contact');
                    }}
                  >
                    {plan.action}<ArrowRight size={15} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 6. LIBRARY OVERLAY (Full Video Catalog) */}
        {activeOverlay === 'library' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <img
                  src="/images/dm-logo.png"
                  alt="Director Menny Logo"
                  className="h-11 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.6)] hidden sm:block"
                />
                <div>
                  <p className="text-xs font-mono tracking-widest text-blue-400">
                    ARCHIVE CATALOG · {videos.length} RELEASES
                  </p>
                  <h2 className="font-['Outfit'] text-2xl md:text-3xl font-bold text-white mt-1">
                    All Releases
                  </h2>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Full filmography directed &amp; edited by Director Menny
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {videos.map((v) => {
                const thumb = getVideoArtwork(v);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      playSound('select');
                      openVideoHub(v.id);
                    }}
                    className="group flex flex-col rounded-[22px] overflow-hidden bg-[#05070d] border border-white/10 hover:border-white text-left transition-all"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                      <img
                        src={thumb}
                        alt={v.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (v.youtubeId && !target.src.includes('hqdefault.jpg')) {
                            target.src = `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[11px] text-white tabular-nums">
                        {v.durationFormatted}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] text-slate-400 truncate">{v.client}</p>
                      <h3 className="font-['Outfit'] text-base font-bold text-white mt-0.5 truncate">
                        {v.shortTitle}
                      </h3>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. CONTACT / MESSAGES OVERLAY */}
        {activeOverlay === 'contact' && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <p className="text-xs font-mono tracking-widest text-blue-400">
                {director.verifiedBanner}
              </p>
              <img
                src="/images/dm-logo.png"
                alt="Director Menny Logo"
                className="h-9 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.6)] hidden sm:block"
              />
            </div>
            <h2 className="font-['Outfit'] text-2xl md:text-3xl font-bold text-white mb-2">
              {director.contact.heading}
            </h2>
            <p className="text-xs text-slate-400 mb-2">
              {director.contact.cta}
            </p>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-slate-400">Email —</span>
              <a
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-300 hover:text-white hover:bg-blue-500/20 font-mono text-xs transition-colors"
                href={`mailto:${director.socials.email}`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>{director.socials.email}</span>
              </a>
            </div>

            {contactStatus.referenceId ? (
              <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center">
                <Check className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="font-['Outfit'] text-xl font-bold text-white">
                  Booking inquiry sent
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Confirmation Reference:{' '}
                  <span className="font-mono font-bold text-emerald-300">
                    {contactStatus.referenceId}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setContactStatus({ loading: false, error: null, referenceId: null });
                    setActiveOverlay('none');
                  }}
                  className="mt-5 px-6 py-2.5 rounded-full bg-white text-slate-950 text-xs font-bold"
                >
                  Return to Console
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="booking-form space-y-4">
                {/* Honeypot anti-spam field */}
                <input
                  type="text"
                  name="website_url_honeypot"
                  tabIndex={-1}
                  autoComplete="off"
                  value={contactForm.honeypot}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, honeypot: e.target.value })
                  }
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="booking-name" className="block text-xs font-medium text-slate-300 mb-1.5">Your Name</label>
                    <input id="booking-name"
                      type="text"
                      required
                      minLength={2}
                      autoComplete="name"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, name: e.target.value })
                      }
                      placeholder="Alex Mercer"
                      className="w-full px-4 py-3 rounded-xl bg-[#05070d] border border-white/15 text-sm text-white focus:border-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="booking-email" className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                    <input id="booking-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, email: e.target.value })
                      }
                      placeholder="alex@label.com"
                      className="w-full px-4 py-3 rounded-xl bg-[#05070d] border border-white/15 text-sm text-white focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="booking-artist" className="block text-xs font-medium text-slate-300 mb-1.5">Artist / Record Label</label>
                    <input id="booking-artist"
                      type="text"
                      value={contactForm.artistOrLabel}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, artistOrLabel: e.target.value })
                      }
                      placeholder="Artist or Management"
                      className="w-full px-4 py-3 rounded-xl bg-[#05070d] border border-white/15 text-sm text-white focus:border-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="booking-service" className="block text-xs font-medium text-slate-300 mb-1.5">Service Scope</label>
                    <div className="relative">
                      <select id="booking-service"
                        value={contactForm.serviceType}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, serviceType: e.target.value })
                        }
                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl bg-[#05070d] border border-white/15 text-sm text-white focus:border-white focus:outline-none cursor-pointer"
                      >
                        {servicePackages.map((plan) => (
                          <option key={plan.id} value={plan.name}>{plan.name}</option>
                        ))}
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="booking-budget" className="block text-xs font-medium text-slate-300 mb-1.5">Estimated Budget</label>
                    <input id="booking-budget"
                      type="text"
                      placeholder="Optional — your budget or range"
                      value={contactForm.budgetRange}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, budgetRange: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-[#05070d] border border-white/15 text-sm text-white focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="booking-brief" className="block text-xs font-medium text-slate-300 mb-1.5">Project Brief, Track Link &amp; Target Shoot Dates</label>
                    <textarea id="booking-brief"
                    rows={4}
                    required
                    minLength={10}
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, message: e.target.value })
                    }
                    placeholder="Share your track link, visual references, target shoot window, and deliverables..."
                    className="w-full px-4 py-3 rounded-xl bg-[#05070d] border border-white/15 text-sm text-white focus:border-white focus:outline-none"
                  />
                </div>

                {contactStatus.error && (
                  <p role="alert" className="text-xs text-red-400">{contactStatus.error}</p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-slate-400">
                    Direct Socials:{' '}
                    <a
                      href={director.socials.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 align-middle text-white hover:underline ml-1 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                      <Instagram aria-hidden="true" className="w-4 h-4 stroke-[1.8]" />
                      Instagram
                    </a>{' '}
                    ·{' '}
                    <a
                      href={`mailto:${director.socials.email}`}
                      title={director.socials.email}
                      className="inline-flex items-center gap-1.5 align-middle text-white hover:underline rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                      <Mail aria-hidden="true" className="w-4 h-4 stroke-[1.8]" />
                      Email
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={contactStatus.loading}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-slate-950 font-['Outfit'] text-xs font-bold tracking-wide hover:bg-slate-100 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {contactStatus.loading ? 'Sending inquiry…' : 'Send booking inquiry'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 8. ACTIVITY CARD DETAIL INSPECTION DRAWER */}
        {activeOverlay === 'card_detail' && activeCardDetail && (
          <div>
            <p className="text-xs font-mono tracking-widest text-blue-400 mb-1">
              {activeCardDetail.kicker}
            </p>
            <h2 className="font-['Outfit'] text-2xl md:text-3xl font-bold text-white mb-4">
              {activeCardDetail.title}
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed mb-6">
              {activeCardDetail.body}
            </p>

            {activeCardDetail.items && activeCardDetail.items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCardDetail.items.map((item, idx) => (
                  <div
                    key={`${item.label}-${idx}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#05070d] border border-white/10"
                  >
                    <span className="text-xs text-slate-400">{item.label}</span>
                    <span className="text-xs font-semibold text-white font-mono tabular-nums text-right ml-3">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
