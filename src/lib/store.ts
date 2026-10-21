import { create } from 'zustand';
import {
  ArtworkCategory,
  ArtworkItem,
  VideoItem,
} from './schemas';
import fallbackVideosJson from '../../content/videos.fallback.json';
import artworkJson from '../../content/artwork.json';

export type BootPhase = 'boot' | 'user_select' | 'home';
export type PrimaryTab = 'videos' | 'music' | 'ai_art';
export type FocusZone =
  | 'TOP_BAR'
  | 'FILTER_BAR'
  | 'TILE_ROW'
  | 'PLAY_BUTTON'
  | 'CARDS_ROW'
  | 'HUB_ACTIONS'
  | 'HUB_CARDS'
  | 'CONTROL_CENTER';

export type OverlayType =
  | 'none'
  | 'control_center'
  | 'account'
  | 'contact'
  | 'library'
  | 'services'
  | 'card_detail';

export type InputSource = 'keyboard' | 'gamepad' | 'mouse' | 'touch';

export interface ActiveCardDetail {
  title: string;
  kicker: string;
  body: string;
  items?: Array<{ label: string; value: string }>;
}

interface DmOsState {
  // Boot & session
  bootPhase: BootPhase;
  setBootPhase: (phase: BootPhase) => void;
  skipOrCompleteBoot: () => void;

  // Content data
  videos: VideoItem[];
  artworks: ArtworkItem[];
  isLiveData: boolean;
  dataSource: 'youtube_api' | 'curated_fallback';
  setVideosPayload: (payload: {
    videos: VideoItem[];
    isLive: boolean;
    source: 'youtube_api' | 'curated_fallback';
  }) => void;

  // Navigation & Spatial Focus Graph
  activeTab: PrimaryTab;
  activeZone: FocusZone;
  topBarIndex: number; // 0: Videos, 1: Music, 2: AI Art, 3: Avatar
  filterBarIndex: number; // 0..4
  selectedArtCategory: ArtworkCategory;
  videoRowIndex: number; // 0..(videos.length + 1) -> last two are Library and Services tiles
  artRowIndex: number;
  cardsRowIndex: number; // 0..4
  musicVideoIndex: number;
  hubActionIndex: number; // 0..3
  hubCardIndex: number; // 0..3
  controlCenterIndex: number; // 0..3

  // Hub & Viewers
  selectedVideoId: string | null; // Non-null means we are inside Video Hub (Game Hub)
  isPlayingVideo: boolean; // Cinema player modal open
  selectedArtId: string | null; // Fullscreen AI Art viewer open
  activeOverlay: OverlayType;
  activeCardDetail: ActiveCardDetail | null;

  // Input & Hardware
  inputSource: InputSource;
  gamepadConnected: boolean;
  gamepadName: string;
  setInputSource: (src: InputSource) => void;
  setGamepadStatus: (connected: boolean, name?: string) => void;

  // Settings
  soundEnabled: boolean;
  ambientPlaying: boolean;
  ambientTrackIndex: number;
  reducedMotion: boolean;
  lowPower2D: boolean;
  hintsMode: 'auto' | InputSource;
  accentOverride: string | null;
  toggleSound: () => void;
  toggleAmbientPlaying: () => void;
  cycleAmbientTrack: () => void;
  setAmbientTrack: (index: number) => void;
  setReducedMotion: (val: boolean) => void;
  setLowPower2D: (val: boolean) => void;
  setHintsMode: (mode: 'auto' | InputSource) => void;
  setAccentOverride: (color: string | null) => void;

  // Actions
  setActiveTab: (tab: PrimaryTab) => void;
  setActiveZone: (zone: FocusZone) => void;
  setVideoRowIndex: (idx: number) => void;
  setArtRowIndex: (idx: number) => void;
  setCardsRowIndex: (idx: number) => void;
  setTopBarIndex: (idx: number) => void;
  setFilterCategory: (cat: ArtworkCategory, idx?: number) => void;
  openVideoHub: (videoId: string) => void;
  closeVideoHub: () => void;
  setIsPlayingVideo: (playing: boolean) => void;
  openArtViewer: (artId: string) => void;
  closeArtViewer: () => void;
  setActiveOverlay: (overlay: OverlayType) => void;
  openCardDetail: (detail: ActiveCardDetail) => void;
  setHubActionIndex: (idx: number) => void;
  setHubCardIndex: (idx: number) => void;
  setControlCenterIndex: (idx: number) => void;
  setMusicVideoIndex: (idx: number) => void;
}

const initialVideos = fallbackVideosJson as VideoItem[];
const initialArtworks = artworkJson as ArtworkItem[];
const FEATURED_EMBED_ID = 'rsgFxDEaroo';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const ART_CATEGORIES: ArtworkCategory[] = [
  'All',
  'Cinematic',
  'Characters',
  'Environments',
  'Concept',
];

export function getHomeVideos(videos: VideoItem[]): VideoItem[] {
  const pinned = videos.filter((v) => v.isPinned);
  return pinned.length > 0 ? pinned : videos;
}

export const useDmStore = create<DmOsState>((set, get) => ({
  bootPhase: 'home',
  setBootPhase: (bootPhase) => {
    if (bootPhase === 'home' && typeof window !== 'undefined') {
      window.sessionStorage.setItem('dm_os_booted', '1');
    }
    set({ bootPhase });
  },
  skipOrCompleteBoot: () => {
    const current = get().bootPhase;
    if (current === 'boot') {
      set({ bootPhase: 'user_select' });
    } else if (current === 'user_select') {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('dm_os_booted', '1');
      }
      set({ bootPhase: 'home', activeZone: 'TILE_ROW' });
    }
  },

  videos: initialVideos,
  artworks: initialArtworks,
  isLiveData: true,
  dataSource: 'curated_fallback',
  setVideosPayload: ({ videos, isLive, source }) =>
    set({
      videos:
        videos.length > 0
          ? videos.map((video, index) =>
              index === 0 ? { ...video, youtubeId: FEATURED_EMBED_ID } : video
            )
          : initialVideos,
      isLiveData: isLive,
      dataSource: source,
    }),

  activeTab: 'videos',
  activeZone: 'TILE_ROW',
  topBarIndex: 0,
  filterBarIndex: 0,
  selectedArtCategory: 'All',
  videoRowIndex: 0,
  artRowIndex: 0,
  cardsRowIndex: 0,
  hubActionIndex: 0,
  hubCardIndex: 0,
  controlCenterIndex: 0,

  selectedVideoId: null,
  isPlayingVideo: false,
  selectedArtId: null,
  activeOverlay: 'none',
  activeCardDetail: null,

  inputSource: 'keyboard',
  gamepadConnected: false,
  gamepadName: '',
  setInputSource: (inputSource) => {
    if (get().inputSource !== inputSource) {
      set({ inputSource });
    }
  },
  setGamepadStatus: (gamepadConnected, gamepadName = '') =>
    set({ gamepadConnected, gamepadName, inputSource: gamepadConnected ? 'gamepad' : get().inputSource }),

  soundEnabled: true,
  ambientPlaying: false,
  ambientTrackIndex: 0,
  reducedMotion: Boolean(prefersReducedMotion),
  lowPower2D: false,
  hintsMode: 'auto',
  accentOverride: null,

  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  toggleAmbientPlaying: () => set((s) => ({ ambientPlaying: !s.ambientPlaying })),
  setAmbientTrack: (index) => set({ ambientTrackIndex: ((index % 3) + 3) % 3 }),
  cycleAmbientTrack: () => set((s) => ({ ambientTrackIndex: (s.ambientTrackIndex + 1) % 3 })),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setLowPower2D: (lowPower2D) => set({ lowPower2D }),
  setHintsMode: (hintsMode) => set({ hintsMode }),
  setAccentOverride: (accentOverride) => set({ accentOverride }),

  setActiveTab: (activeTab) =>
    set({
      activeTab,
      ambientPlaying: false,
      selectedVideoId: null,
      selectedArtId: null,
      activeZone: 'TILE_ROW',
      topBarIndex: activeTab === 'videos' ? 0 : activeTab === 'music' ? 1 : 2,
    }),
  setActiveZone: (activeZone) => set({ activeZone }),
  setVideoRowIndex: (videoRowIndex) => set({ videoRowIndex, activeZone: 'TILE_ROW' }),
  setArtRowIndex: (artRowIndex) => set({ artRowIndex, activeZone: 'TILE_ROW' }),
  setCardsRowIndex: (cardsRowIndex) => set({ cardsRowIndex, activeZone: 'CARDS_ROW' }),
  setTopBarIndex: (topBarIndex) => set({ topBarIndex, activeZone: 'TOP_BAR' }),
  setFilterCategory: (selectedArtCategory, idx) =>
    set({
      selectedArtCategory,
      filterBarIndex: idx ?? ART_CATEGORIES.indexOf(selectedArtCategory),
      artRowIndex: 0,
    }),
  openVideoHub: (videoId) => {
    set({
      selectedVideoId: videoId,
      activeZone: 'HUB_ACTIONS',
      hubActionIndex: 0,
      activeOverlay: 'none',
    });
  },
  closeVideoHub: () =>
    set({
      selectedVideoId: null,
      isPlayingVideo: false,
      activeZone: 'TILE_ROW',
    }),
  setIsPlayingVideo: (isPlayingVideo) => set({ isPlayingVideo }),
  openArtViewer: (artId) => set({ selectedArtId: artId }),
  closeArtViewer: () => set({ selectedArtId: null, activeZone: 'TILE_ROW' }),
  setActiveOverlay: (activeOverlay) =>
    set((s) => ({
      activeOverlay,
      activeZone:
        activeOverlay === 'control_center'
          ? 'CONTROL_CENTER'
          : s.selectedVideoId
          ? 'HUB_ACTIONS'
          : 'TILE_ROW',
    })),
  openCardDetail: (activeCardDetail) =>
    set({ activeCardDetail, activeOverlay: 'card_detail' }),
  setHubActionIndex: (hubActionIndex) => set({ hubActionIndex, activeZone: 'HUB_ACTIONS' }),
  setHubCardIndex: (hubCardIndex) => set({ hubCardIndex, activeZone: 'HUB_CARDS' }),
  musicVideoIndex: 0,
  setMusicVideoIndex: (musicVideoIndex) => set({ musicVideoIndex }),
  setControlCenterIndex: (controlCenterIndex) =>
    set({ controlCenterIndex, activeZone: 'CONTROL_CENTER' }),
}));
