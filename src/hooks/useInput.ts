import { useEffect, useRef } from 'react';
import { ART_CATEGORIES, useDmStore, getHomeVideos } from '../lib/store';
import { soundEngine } from './useSound';

export type ConsoleAction =
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'SELECT'
  | 'BACK'
  | 'TAB_LEFT'
  | 'TAB_RIGHT'
  | 'HOME';

export function dispatchConsoleAction(action: ConsoleAction) {
  const s = useDmStore.getState();

  // 1. Boot & User Select phases
  if (s.bootPhase === 'boot') {
    soundEngine.play('select', s.soundEnabled);
    s.skipOrCompleteBoot();
    return;
  }

  if (s.bootPhase === 'user_select') {
    if (action === 'SELECT' || action === 'HOME') {
      soundEngine.play('select', s.soundEnabled);
      s.skipOrCompleteBoot();
    }
    return;
  }

  // 2. HOME / Guide Button toggles Control Center anytime
  if (action === 'HOME') {
    soundEngine.play('controlCenterWhoosh', s.soundEnabled);
    if (s.activeOverlay === 'control_center') {
      s.setActiveOverlay('none');
    } else {
      s.setActiveOverlay('control_center');
    }
    return;
  }

  // 3. Cinema Video Player Modal open
  if (s.isPlayingVideo) {
    if (action === 'BACK') {
      soundEngine.play('back', s.soundEnabled);
      s.setIsPlayingVideo(false);
    }
    return;
  }

  // 4. Full-screen AI Art Viewer open
  if (s.selectedArtId) {
    const filtered =
      s.selectedArtCategory === 'All'
        ? s.artworks
        : s.artworks.filter((a) => a.category === s.selectedArtCategory);
    const currentIdx = filtered.findIndex((a) => a.id === s.selectedArtId);

    if (action === 'BACK') {
      soundEngine.play('back', s.soundEnabled);
      s.closeArtViewer();
      return;
    }
    if (action === 'LEFT' && currentIdx > 0) {
      soundEngine.play('focusTick', s.soundEnabled);
      s.openArtViewer(filtered[currentIdx - 1].id);
      s.setArtRowIndex(currentIdx - 1);
      return;
    }
    if (action === 'RIGHT' && currentIdx < filtered.length - 1) {
      soundEngine.play('focusTick', s.soundEnabled);
      s.openArtViewer(filtered[currentIdx + 1].id);
      s.setArtRowIndex(currentIdx + 1);
      return;
    }
    return;
  }

  // 5. Overlays (Control Center, Account, Contact, Library, Services, Card Detail)
  if (s.activeOverlay !== 'none') {
    if (action === 'BACK') {
      soundEngine.play('back', s.soundEnabled);
      s.setActiveOverlay('none');
      return;
    }

    if (s.activeOverlay === 'control_center') {
      if (action === 'LEFT') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setControlCenterIndex((s.controlCenterIndex + 3) % 4);
      } else if (action === 'RIGHT') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setControlCenterIndex((s.controlCenterIndex + 1) % 4);
      } else if (action === 'SELECT') {
        soundEngine.play('select', s.soundEnabled);
        if (s.controlCenterIndex === 0) {
          s.cycleAmbientTrack();

        } else if (s.controlCenterIndex === 1) {
          s.toggleSound();
        } else if (s.controlCenterIndex === 2) {
          s.setActiveOverlay('contact');
        } else if (s.controlCenterIndex === 3) {
          s.setActiveOverlay('none');
          s.setBootPhase('user_select');
        }
      }
    }
    return;
  }

  // Shoulder buttons cycle through every primary tab.
  if (!s.selectedVideoId && (action === 'TAB_LEFT' || action === 'TAB_RIGHT')) {
    const tabs = ['videos', 'music', 'ai_art'] as const;
    const next = (tabs.indexOf(s.activeTab) + (action === 'TAB_RIGHT' ? 1 : -1) + tabs.length) % tabs.length;
    soundEngine.play('tabSwitch', s.soundEnabled);
    s.setActiveTab(tabs[next]);
    return;
  }

  // 7. Inside Video Hub (PS5 Game Hub)
  if (s.selectedVideoId) {
    const vid = s.videos.find((v) => v.id === s.selectedVideoId) || s.videos[0];
    if (action === 'BACK') {
      soundEngine.play('back', s.soundEnabled);
      if (s.isPlayingVideo) {
        s.setIsPlayingVideo(false);
      } else {
        s.closeVideoHub();
      }
      return;
    }

    if (s.activeZone === 'HUB_ACTIONS') {
      if (action === 'LEFT') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setHubActionIndex(Math.max(0, s.hubActionIndex - 1));
      } else if (action === 'RIGHT') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setHubActionIndex(Math.min(3, s.hubActionIndex + 1));
      } else if (action === 'DOWN') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setActiveZone('HUB_CARDS');
      } else if (action === 'SELECT') {
        soundEngine.play('select', s.soundEnabled);
        if (s.hubActionIndex === 0) {
          s.setIsPlayingVideo(true);
        } else if (s.hubActionIndex === 1) {
          s.openCardDetail({
            title: vid.shortTitle,
            kicker: 'YOUTUBE STREAM VERIFICATION',
            body: `Direct YouTube ID: ${vid.youtubeId}. Press Play in the Video Hub to watch inside the DM OS Anamorphic Cinema Player, or copy the link below.`,
            items: [
              { label: 'YouTube URL', value: `https://www.youtube.com/watch?v=${vid.youtubeId}` },
              { label: 'Total Views', value: vid.views.toLocaleString() },
              { label: 'Duration', value: vid.durationFormatted },
            ],
          });
        } else if (s.hubActionIndex === 2) {
          if (navigator.clipboard) {
            navigator.clipboard
              .writeText(`https://www.youtube.com/watch?v=${vid.youtubeId}`)
              .catch(() => {});
          }
          s.openCardDetail({
            title: 'Share Link Copied',
            kicker: 'SYSTEM CLIPBOARD',
            body: `Copied link for "${vid.title}" to your system clipboard.`,
          });
        } else if (s.hubActionIndex === 3) {
          s.openCardDetail({
            title: `${vid.shortTitle} — Full Credits`,
            kicker: vid.client,
            body: vid.brief,
            items: vid.credits.map((c) => ({ label: c.role, value: c.name })),
          });
        }
      }
      return;
    }

    if (s.activeZone === 'HUB_CARDS') {
      if (action === 'LEFT') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setHubCardIndex(Math.max(0, s.hubCardIndex - 1));
      } else if (action === 'RIGHT') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setHubCardIndex(0);
      } else if (action === 'UP') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setActiveZone('HUB_ACTIONS');
      } else if (action === 'SELECT') {
        soundEngine.play('select', s.soundEnabled);
        if (s.hubCardIndex === 0) {
          s.openCardDetail({
            title: 'Production Credits',
            kicker: vid.shortTitle,
            body: `Directed & Edited by Director Menny for ${vid.client}.`,
            items: vid.credits.map((c) => ({ label: c.role, value: c.name })),
          });
        } else if (s.hubCardIndex === 1) {
          s.openCardDetail({
            title: 'Behind the Scenes',
            kicker: 'ON-SET & CAMERA RIGS',
            body: vid.behindTheScenes,
          });
        } else if (s.hubCardIndex === 2) {
          s.openCardDetail({
            title: 'Client Brief & Treatment',
            kicker: vid.client,
            body: vid.brief,
          });
        } else if (s.hubCardIndex === 3) {
          s.openCardDetail({
            title: 'Tools & Camera Pipeline',
            kicker: 'TECHNICAL SPEC',
            body: 'Camera systems, lenses, editing software, and VFX suite deployed on this project:',
            items: vid.toolsUsed.map((t, i) => ({ label: `Pipeline 0${i + 1}`, value: t })),
          });
        }
      }
      return;
    }
  }

  // 8. Home Screen Spatial Focus Graph (TOP_BAR <-> FILTER_BAR <-> TILE_ROW <-> PLAY_BUTTON <-> CARDS_ROW)
  const homeVideos = getHomeVideos(s.videos);
  const totalVideoRowItems = homeVideos.length + 2; // + Library tile + Services tile
  const filteredArts =
    s.selectedArtCategory === 'All'
      ? s.artworks
      : s.artworks.filter((a) => a.category === s.selectedArtCategory);

  if (s.activeZone === 'TOP_BAR') {
    if (action === 'LEFT') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setTopBarIndex(Math.max(0, s.topBarIndex - 1));
    } else if (action === 'RIGHT') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setTopBarIndex(Math.min(3, s.topBarIndex + 1));
    } else if (action === 'DOWN' || action === 'UP') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setActiveZone(s.activeTab === 'ai_art' ? 'FILTER_BAR' : 'TILE_ROW');
    } else if (action === 'SELECT') {
      soundEngine.play('select', s.soundEnabled);
      if (s.topBarIndex === 0) s.setActiveTab('videos');
      else if (s.topBarIndex === 1) s.setActiveTab('music');
      else if (s.topBarIndex === 2) s.setActiveTab('ai_art');
      else if (s.topBarIndex === 3) s.setActiveOverlay('account');
    }
    return;
  }

  if (s.activeTab === 'music') {
    const total = s.videos.length || 1;
    if (action === 'LEFT') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setMusicVideoIndex((s.musicVideoIndex - 1 + total) % total);
    } else if (action === 'RIGHT') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setMusicVideoIndex((s.musicVideoIndex + 1) % total);
    } else if (action === 'SELECT') {
      soundEngine.play('select', s.soundEnabled);
      // MusicView owns its inline visual player; keep selection on the Music screen.
    } else if (action === 'UP' || action === 'BACK') {
      s.setActiveZone('TOP_BAR');
    } else if (action === 'DOWN') {
      s.setActiveZone(s.activeZone === 'PLAY_BUTTON' ? 'TOP_BAR' : 'PLAY_BUTTON');
    }
    return;
  }

  if (s.activeZone === 'FILTER_BAR') {
    if (action === 'LEFT') {
      soundEngine.play('focusTick', s.soundEnabled);
      const nextIdx = Math.max(0, s.filterBarIndex - 1);
      s.setFilterCategory(ART_CATEGORIES[nextIdx], nextIdx);
    } else if (action === 'RIGHT') {
      soundEngine.play('focusTick', s.soundEnabled);
      const nextIdx = Math.min(ART_CATEGORIES.length - 1, s.filterBarIndex + 1);
      s.setFilterCategory(ART_CATEGORIES[nextIdx], nextIdx);
    } else if (action === 'UP') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setActiveZone('TOP_BAR');
    } else if (action === 'DOWN' || action === 'SELECT') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setActiveZone('TILE_ROW');
    }
    return;
  }

  if (s.activeZone === 'TILE_ROW') {
    if (s.activeTab === 'videos') {
      if (action === 'LEFT') {
        if (s.videoRowIndex > 0) {
          soundEngine.play('focusTick', s.soundEnabled);
          const next = s.videoRowIndex - 1;
          s.setVideoRowIndex(next);
        }
      } else if (action === 'RIGHT') {
        if (s.videoRowIndex < totalVideoRowItems - 1) {
          soundEngine.play('focusTick', s.soundEnabled);
          const next = s.videoRowIndex + 1;
          s.setVideoRowIndex(next);
        }
      } else if (action === 'UP') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setActiveZone('TOP_BAR');
      } else if (action === 'DOWN') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setActiveZone('PLAY_BUTTON');
      } else if (action === 'SELECT') {
        soundEngine.play('select', s.soundEnabled);
        if (s.videoRowIndex < homeVideos.length) {
          s.openVideoHub(homeVideos[s.videoRowIndex].id);
        } else if (s.videoRowIndex === homeVideos.length) {
          s.setActiveOverlay('library');
        } else {
          s.setActiveOverlay('services');
        }
      }
    } else {
      // AI Art Tile Row
      if (action === 'LEFT' && s.artRowIndex > 0) {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setArtRowIndex(s.artRowIndex - 1);
      } else if (action === 'RIGHT' && s.artRowIndex < filteredArts.length - 1) {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setArtRowIndex(s.artRowIndex + 1);
      } else if (action === 'UP') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setActiveZone('FILTER_BAR');
      } else if (action === 'DOWN') {
        soundEngine.play('focusTick', s.soundEnabled);
        s.setActiveZone('PLAY_BUTTON');
      } else if (action === 'SELECT' && filteredArts[s.artRowIndex]) {
        soundEngine.play('select', s.soundEnabled);
        s.openArtViewer(filteredArts[s.artRowIndex].id);
      }
    }
    return;
  }

  if (s.activeZone === 'PLAY_BUTTON') {
    if (action === 'UP') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setActiveZone('TILE_ROW');
    } else if (action === 'DOWN') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setActiveZone('TOP_BAR');
    } else if (action === 'LEFT' || action === 'RIGHT') {
      // Allow horizontal browsing while on the Play button
      s.setActiveZone('TILE_ROW');
      dispatchConsoleAction(action);
    } else if (action === 'SELECT') {
      soundEngine.play('select', s.soundEnabled);
      if (s.activeTab === 'videos') {
        if (s.videoRowIndex < homeVideos.length) {
          s.openVideoHub(homeVideos[s.videoRowIndex].id);
        } else if (s.videoRowIndex === homeVideos.length) {
          s.setActiveOverlay('library');
        } else {
          s.setActiveOverlay('services');
        }
      } else if (filteredArts[s.artRowIndex]) {
        s.openArtViewer(filteredArts[s.artRowIndex].id);
      }
    }
    return;
  }

  if (s.activeZone === 'CARDS_ROW') {
    const vid = homeVideos[Math.min(s.videoRowIndex, homeVideos.length - 1)];
    if (action === 'LEFT') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setCardsRowIndex(Math.max(0, s.cardsRowIndex - 1));
    } else if (action === 'RIGHT') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setCardsRowIndex(Math.min(4, s.cardsRowIndex + 1));
    } else if (action === 'UP') {
      soundEngine.play('focusTick', s.soundEnabled);
      s.setActiveZone('PLAY_BUTTON');
    } else if (action === 'SELECT' && vid) {
      soundEngine.play('select', s.soundEnabled);
      s.openVideoHub(vid.id);
    }
  }
}

export function useInput() {
  const setInputSource = useDmStore((s) => s.setInputSource);
  const setGamepadStatus = useDmStore((s) => s.setGamepadStatus);
  const lastStickTimeRef = useRef(0);
  const prevButtonsRef = useRef<boolean[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');

      setInputSource('keyboard');

      if (isInputFocused) {
        if (e.key === 'Escape') {
          e.preventDefault();
          (target as HTMLElement).blur();
          dispatchConsoleAction('BACK');
        }
        return;
      }

      // The dock can retain focus after opening Music. Scroll its content rather
      // than consuming vertical keys in the console focus graph.
      const state = useDmStore.getState();
      if (state.activeTab === 'music' && state.activeOverlay === 'none' && !state.selectedVideoId) {
        const music = document.querySelector<HTMLElement>('.music-view');
        if (music && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
          e.preventDefault();
          if (e.key === 'Home' || e.key === 'End') {
            music.scrollTo({ top: e.key === 'Home' ? 0 : music.scrollHeight });
          } else {
            const amount = e.key.startsWith('Page') ? music.clientHeight * 0.85 : 64;
            music.scrollBy({ top: /Up$/.test(e.key) ? -amount : amount });
          }
          return;
        }
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          dispatchConsoleAction('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          dispatchConsoleAction('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          dispatchConsoleAction('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          dispatchConsoleAction('RIGHT');
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          dispatchConsoleAction('SELECT');
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          dispatchConsoleAction('BACK');
          break;
        case 'q':
        case 'Q':
          e.preventDefault();
          dispatchConsoleAction('TAB_LEFT');
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          dispatchConsoleAction('TAB_RIGHT');
          break;
        case 'g':
        case 'G':
        case 'Home':
          e.preventDefault();
          dispatchConsoleAction('HOME');
          break;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      setInputSource('touch');
      // Native scrolling must not also move console focus or re-center carousels.
      // Music handles its own cover gestures.
      if ((e.target as Element | null)?.closest('.music-view, .console-home, .art-gallery, .video-hub, .portfolio-overlay, .art-viewer')) {
        touchStartRef.current = null;
        return;
      }
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      if (Math.abs(dx) < 40 && Math.abs(dy) < 40) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        dispatchConsoleAction(dx > 0 ? 'LEFT' : 'RIGHT');
      } else {
        dispatchConsoleAction(dy > 0 ? 'UP' : 'DOWN');
      }
    };

    const onGamepadConnected = (e: GamepadEvent) => {
      setGamepadStatus(true, e.gamepad.id);
      refreshGamepadPolling();
    };

    const onGamepadDisconnected = () => {
      const remaining = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
      setGamepadStatus(Boolean(remaining), remaining?.id || '');
      prevButtonsRef.current = [];
      refreshGamepadPolling();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('gamepadconnected', onGamepadConnected);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected);

    // Poll only while a controller is connected and the page is visible.
    let rafId = 0;
    const pollGamepad = (now: number) => {
      if (navigator.getGamepads) {
        const pads = navigator.getGamepads();
        const pad = pads[0] || pads[1] || pads[2] || pads[3];
        if (pad) {
          const buttons = pad.buttons.map((b) => b.pressed);
          const prev = prevButtonsRef.current;

          const justPressed = (idx: number) => buttons[idx] && !prev[idx];

          if (justPressed(0)) {
            setInputSource('gamepad');
            dispatchConsoleAction('SELECT');
          } else if (justPressed(1)) {
            setInputSource('gamepad');
            dispatchConsoleAction('BACK');

          } else if (justPressed(4)) {
            setInputSource('gamepad');
            dispatchConsoleAction('TAB_LEFT');
          } else if (justPressed(5)) {
            setInputSource('gamepad');
            dispatchConsoleAction('TAB_RIGHT');
          } else if (justPressed(16) || justPressed(9)) {
            setInputSource('gamepad');
            dispatchConsoleAction('HOME');
          } else if (justPressed(12)) {
            setInputSource('gamepad');
            dispatchConsoleAction('UP');
          } else if (justPressed(13)) {
            setInputSource('gamepad');
            dispatchConsoleAction('DOWN');
          } else if (justPressed(14)) {
            setInputSource('gamepad');
            dispatchConsoleAction('LEFT');
          } else if (justPressed(15)) {
            setInputSource('gamepad');
            dispatchConsoleAction('RIGHT');
          }

          prevButtonsRef.current = buttons;

          // Left analog stick with 0.35 deadzone & 180ms repeat throttle
          const axX = pad.axes[0] || 0;
          const axY = pad.axes[1] || 0;
          if (now - lastStickTimeRef.current > 180) {
            if (axX < -0.45) {
              setInputSource('gamepad');
              dispatchConsoleAction('LEFT');
              lastStickTimeRef.current = now;
            } else if (axX > 0.45) {
              setInputSource('gamepad');
              dispatchConsoleAction('RIGHT');
              lastStickTimeRef.current = now;
            } else if (axY < -0.45) {
              setInputSource('gamepad');
              dispatchConsoleAction('UP');
              lastStickTimeRef.current = now;
            } else if (axY > 0.45) {
              setInputSource('gamepad');
              dispatchConsoleAction('DOWN');
              lastStickTimeRef.current = now;
            }
          }
        }
      }
      rafId = window.requestAnimationFrame(pollGamepad);
    };
    const refreshGamepadPolling = () => {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
      if (!document.hidden && Array.from(navigator.getGamepads?.() ?? []).some(Boolean)) {
        rafId = window.requestAnimationFrame(pollGamepad);
      }
    };
    document.addEventListener('visibilitychange', refreshGamepadPolling);
    refreshGamepadPolling();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
      document.removeEventListener('visibilitychange', refreshGamepadPolling);
      window.cancelAnimationFrame(rafId);
    };
  }, [setInputSource, setGamepadStatus]);
}
