# DM OS Audio Assets & Procedural Sound Engine

DM OS uses a real-time **Procedural Web Audio API Synthesizer & Ambient Pad Engine** (`src/hooks/useSound.ts`) out of the box so every console interaction responds with zero network latency and 100% original acoustic synthesis (no Sony/PlayStation copyrighted sounds).

## Synthesized Sound Sprites
- `focusTick`: Crisp high-Q resonant impulse (1150Hz -> 620Hz, 28ms)
- `select`: Dual-harmonic glass confirmation chord (523.25Hz + 783.99Hz + 1046.5Hz, 160ms)
- `back`: Descending warm sub-drop (440Hz -> 220Hz, 130ms)
- `tabSwitch`: Airy stereo filter sweep (680Hz -> 960Hz, 85ms)
- `bootSwell`: 3.8s deep sub-bass drone + shimmering fifths harmonic bloom
- `trophyChime`: 4-note ascending crystalline arpeggio (C5 -> E5 -> G5 -> B5 -> D6)
- `controlCenterWhoosh`: Bandpass-filtered pink noise sweep + sub-thump
- `ambientPad`: Continuous generative minor-9th spatial pad at `0.15` volume with a live `BiquadFilterNode` low-pass filter that ducks from `2400Hz` down to `280Hz` when the Control Center or a modal opens.

## Custom Audio File Override (Optional)
If you wish to override any procedural sprite with external `.mp3` or `.ogg` stems, place them in `/public/sfx/`:
- `focus.mp3`
- `select.mp3`
- `back.mp3`
- `tab.mp3`
- `boot.mp3`
- `trophy.mp3`
- `whoosh.mp3`
- `ambient.mp3`
