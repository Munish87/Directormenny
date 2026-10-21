import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type AppPhase = 'boot' | 'user-select' | 'home' | 'hub' | 'gallery' | 'search' | 'settings' | 'contact' | 'about';
export type ActiveTab = 'videos' | 'ai-art';
export type FocusZone = 'topbar' | 'tiles' | 'play-button' | 'cards' | 'hub-actions' | 'control-center' | 'search' | 'settings' | 'gallery' | 'gallery-viewer';

export interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  thumbnailHigh?: string;
  viewCount: number;
  likeCount: number;
  duration: string;
  durationSeconds: number;
  publishedAt: string;
  youtubeUrl: string;
  client?: string;
  role?: string;
  credits?: Record<string, string>;
  tools?: string[];
  behindTheScenes?: string;
}

export interface ArtworkData {
  id: string;
  title: string;
  tool: string;
  tags: string[];
  imageUrl: string;
  blurDataUrl?: string;
  category: 'cinematic' | 'characters' | 'environments' | 'concept';
  year: number;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'upload' | 'milestone' | 'system';
  read: boolean;
  videoId?: string;
}

interface AppState {
  // Phase & navigation
  phase: AppPhase;
  activeTab: ActiveTab;
  focusZone: FocusZone;
  previousPhase: AppPhase | null;

  // Focus tracking
  focusedTileIndex: number;
  focusedCardIndex: number;
  focusedTopBarIndex: number;
  focusedHubActionIndex: number;
  focusedGalleryIndex: number;

  // Content
  videos: VideoData[];
  artworks: ArtworkData[];
  selectedVideo: VideoData | null;
  selectedArtwork: ArtworkData | null;
  dataTimestamp: Date | null;

  // UI state
  isControlCenterOpen: boolean;
  isPlayerOpen: boolean;
  isBootComplete: boolean;
  hasBootPlayed: boolean;
  notifications: NotificationData[];
  accentColor: string;

  // Audio
  isMuted: boolean;
  ambientVolume: number;

  // Input hint mode
  inputMode: 'keyboard' | 'gamepad' | 'touch';

  // Actions
  setPhase: (phase: AppPhase) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setFocusZone: (zone: FocusZone) => void;
  setFocusedTileIndex: (index: number) => void;
  setFocusedCardIndex: (index: number) => void;
  setFocusedTopBarIndex: (index: number) => void;
  setFocusedHubActionIndex: (index: number) => void;
  setFocusedGalleryIndex: (index: number) => void;
  setVideos: (videos: VideoData[]) => void;
  setArtworks: (artworks: ArtworkData[]) => void;
  setSelectedVideo: (video: VideoData | null) => void;
  setSelectedArtwork: (artwork: ArtworkData | null) => void;
  setDataTimestamp: (ts: Date | null) => void;
  toggleControlCenter: () => void;
  setControlCenter: (open: boolean) => void;
  openPlayer: () => void;
  closePlayer: () => void;
  setBootComplete: (v: boolean) => void;
  setHasBootPlayed: (v: boolean) => void;
  addNotification: (n: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationsRead: () => void;
  setAccentColor: (color: string) => void;
  toggleMute: () => void;
  setAmbientVolume: (v: number) => void;
  setInputMode: (mode: 'keyboard' | 'gamepad' | 'touch') => void;
  goBack: () => void;
  navigateTo: (phase: AppPhase, prev?: AppPhase) => void;
}

let notifId = 0;

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    phase: 'boot',
    activeTab: 'videos',
    focusZone: 'tiles',
    previousPhase: null,
    focusedTileIndex: 0,
    focusedCardIndex: 0,
    focusedTopBarIndex: -1,
    focusedHubActionIndex: 0,
    focusedGalleryIndex: 0,
    videos: [],
    artworks: [],
    selectedVideo: null,
    selectedArtwork: null,
    dataTimestamp: null,
    isControlCenterOpen: false,
    isPlayerOpen: false,
    isBootComplete: false,
    hasBootPlayed: false,
    notifications: [],
    accentColor: '#1a6fe6',
    isMuted: false,
    ambientVolume: 0.15,
    inputMode: 'keyboard',

    // Actions
    setPhase: (phase) => set({ phase }),
    setActiveTab: (activeTab) => set({ activeTab }),
    setFocusZone: (focusZone) => set({ focusZone }),
    setFocusedTileIndex: (focusedTileIndex) => set({ focusedTileIndex }),
    setFocusedCardIndex: (focusedCardIndex) => set({ focusedCardIndex }),
    setFocusedTopBarIndex: (focusedTopBarIndex) => set({ focusedTopBarIndex }),
    setFocusedHubActionIndex: (focusedHubActionIndex) => set({ focusedHubActionIndex }),
    setFocusedGalleryIndex: (focusedGalleryIndex) => set({ focusedGalleryIndex }),
    setVideos: (videos) => set({ videos }),
    setArtworks: (artworks) => set({ artworks }),
    setSelectedVideo: (selectedVideo) => set({ selectedVideo }),
    setSelectedArtwork: (selectedArtwork) => set({ selectedArtwork }),
    setDataTimestamp: (dataTimestamp) => set({ dataTimestamp }),
    toggleControlCenter: () => set((s) => ({ isControlCenterOpen: !s.isControlCenterOpen })),
    setControlCenter: (isControlCenterOpen) => set({ isControlCenterOpen }),
    openPlayer: () => set({ isPlayerOpen: true }),
    closePlayer: () => set({ isPlayerOpen: false }),
    setBootComplete: (isBootComplete) => set({ isBootComplete }),
    setHasBootPlayed: (hasBootPlayed) => set({ hasBootPlayed }),
    addNotification: (n) =>
      set((s) => ({
        notifications: [
          { ...n, id: String(++notifId), timestamp: new Date(), read: false },
          ...s.notifications,
        ].slice(0, 20),
      })),
    markNotificationsRead: () =>
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
      })),
    setAccentColor: (accentColor) => set({ accentColor }),
    toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
    setAmbientVolume: (ambientVolume) => set({ ambientVolume }),
    setInputMode: (inputMode) => set({ inputMode }),
    goBack: () => {
      const { phase, previousPhase, isControlCenterOpen, isPlayerOpen } = get();
      if (isPlayerOpen) { set({ isPlayerOpen: false }); return; }
      if (isControlCenterOpen) { set({ isControlCenterOpen: false }); return; }
      if (phase === 'hub') { set({ phase: 'home', selectedVideo: null, focusZone: 'tiles' }); return; }
      if (phase === 'search' || phase === 'settings' || phase === 'contact' || phase === 'about') {
        set({ phase: previousPhase || 'home' });
      }
    },
    navigateTo: (phase, prev) =>
      set((s) => ({
        phase,
        previousPhase: prev ?? s.phase,
        isControlCenterOpen: false,
      })),
  }))
);
