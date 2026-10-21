import { useEffect } from 'react';
import { useDmStore } from '../lib/store';

export type SoundSpriteName =
  | 'focusTick'
  | 'select'
  | 'back'
  | 'tabSwitch'
  | 'bootSwell'
  | 'controlCenterWhoosh';

export const AMBIENT_TRACKS = [
  {
    title: 'HYPERION SUB-ATMOSPHERE',
    artist: 'Director Menny · Spatial System Pad 01',
    freqs: [110, 164.81, 220, 261.63, 329.63], // A minor 9
  },
  {
    title: 'VIK BASALT HORIZON',
    artist: 'Director Menny · Spatial System Pad 02',
    freqs: [98, 146.83, 196, 246.94, 293.66], // G maj7 / E min9
  },
  {
    title: 'ORBITAL CATHEDRAL DRIFT',
    artist: 'Director Menny · Spatial System Pad 03',
    freqs: [130.81, 196.0, 246.94, 293.66, 392.0], // C maj9
  },
];

class ConsoleAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientOscs: OscillatorNode[] = [];
  private isAmbientStarted = false;
  private currentTrackIdx = -1;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public triggerHaptic(durationMs = 18, weak = 0.2, strong = 0.08) {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    try {
      const pads = navigator.getGamepads();
      for (const pad of pads) {
        if (pad && pad.vibrationActuator) {
          pad.vibrationActuator
            .playEffect('dual-rumble', {
              startDelay: 0,
              duration: durationMs,
              weakMagnitude: weak,
              strongMagnitude: strong,
            })
            .catch(() => {});
        }
      }
    } catch {
      // Ignore unsupported gamepad haptics
    }
  }

  public play(sprite: SoundSpriteName, enabled = true) {
    if (sprite === 'focusTick') {
      this.triggerHaptic(14, 0.14, 0.02);
    } else if (sprite === 'select') {
      this.triggerHaptic(35, 0.4, 0.25);
    }
    if (!enabled) return;

    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (sprite) {
      case 'focusTick': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1120, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.028);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.032);
        break;
      }

      case 'select': {
        const freqs = [523.25, 783.99, 1046.5];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.015);
          osc.frequency.exponentialRampToValueAtTime(f * 1.02, now + 0.18);

          gain.gain.setValueAtTime(0.06 / (idx + 1), now + idx * 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.015);
          osc.stop(now + 0.22);
        });
        break;
      }

      case 'back': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(210, now + 0.13);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'tabSwitch': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.08);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.095);
        break;
      }

      case 'bootSwell': {
        const chord = [55, 110, 164.81, 220, 329.63, 493.88];
        chord.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = i < 2 ? 'sawtooth' : 'sine';
          osc.frequency.setValueAtTime(f * 0.98, now);
          osc.frequency.exponentialRampToValueAtTime(f, now + 1.8);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(180, now);
          filter.frequency.exponentialRampToValueAtTime(2400, now + 2.2);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.045 / (i * 0.5 + 1), now + 1.6);
          gain.gain.exponentialRampToValueAtTime(0.0005, now + 3.7);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 3.8);
        });
        break;
      }

      case 'controlCenterWhoosh': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.16);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
        break;
      }
    }
  }

  public syncAmbient(
    shouldPlay: boolean,
    lowPassActive: boolean,
    trackIndex: number
  ) {
    if (!shouldPlay) {
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
      }
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx) return;

    if (!this.isAmbientStarted || this.currentTrackIdx !== trackIndex) {
      this.stopAmbientOscillators();
      this.currentTrackIdx = trackIndex;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(lowPassActive ? 280 : 1850, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.setTargetAtTime(0.045, ctx.currentTime, 0.8); // Soft 0.15 normalized pad

      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      const preset = AMBIENT_TRACKS[trackIndex % AMBIENT_TRACKS.length];
      this.ambientOscs = preset.freqs.map((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime((idx - 2) * 4, ctx.currentTime);
        oscGain.gain.setValueAtTime(0.18 / (idx * 0.4 + 1), ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        return osc;
      });

      this.ambientFilter = filter;
      this.ambientGain = masterGain;
      this.isAmbientStarted = true;
    } else if (this.ambientGain && this.ambientFilter) {
      this.ambientGain.gain.setTargetAtTime(
        lowPassActive ? 0.025 : 0.045,
        ctx.currentTime,
        0.25
      );
      this.ambientFilter.frequency.setTargetAtTime(
        lowPassActive ? 280 : 1850,
        ctx.currentTime,
        0.25
      );
    }
  }

  private stopAmbientOscillators() {
    this.ambientOscs.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {}
    });
    this.ambientOscs = [];
    this.isAmbientStarted = false;
  }
}

export const soundEngine = new ConsoleAudioEngine();

export function useSound() {
  const soundEnabled = useDmStore((s) => s.soundEnabled);
  const activeTab = useDmStore((s) => s.activeTab);
  const ambientPlaying = useDmStore((s) => s.ambientPlaying);
  const ambientTrackIndex = useDmStore((s) => s.ambientTrackIndex);
  const bootPhase = useDmStore((s) => s.bootPhase);
  const activeOverlay = useDmStore((s) => s.activeOverlay);
  const isPlayingVideo = useDmStore((s) => s.isPlayingVideo);

  useEffect(() => {
    const shouldPlayAmbient =
      soundEnabled && ambientPlaying && activeTab === 'music' && bootPhase === 'home' && !isPlayingVideo;
    const lowPassActive = activeOverlay !== 'none';

    const handleFirstInteraction = () => {
      soundEngine.syncAmbient(shouldPlayAmbient, lowPassActive, ambientTrackIndex);
    };

    soundEngine.syncAmbient(shouldPlayAmbient, lowPassActive, ambientTrackIndex);
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [soundEnabled, ambientPlaying, ambientTrackIndex, bootPhase, activeOverlay, isPlayingVideo, activeTab]);

  return {
    playSound: (sprite: SoundSpriteName) => soundEngine.play(sprite, soundEnabled),
  };
}
