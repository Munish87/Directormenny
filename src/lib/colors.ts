/**
 * Dynamic color extraction and CSS variable / WebGL uniform converter.
 */

export interface RgbColor {
  r: number; // 0..1
  g: number; // 0..1
  b: number; // 0..1
}

export function hexToNormalizedRgb(hex: string): RgbColor {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) {
    return { r: 0.23, g: 0.51, b: 0.96 }; // Default #3b82f6
  }
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) {
    return { r: 0.23, g: 0.51, b: 0.96 };
  }
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

export function applyDynamicThemeColors(dominantHex: string, secondaryHex = '#06b6d4'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const rgb = hexToNormalizedRgb(dominantHex);
  const r255 = Math.round(rgb.r * 255);
  const g255 = Math.round(rgb.g * 255);
  const b255 = Math.round(rgb.b * 255);

  root.style.setProperty('--dm-accent', dominantHex);
  root.style.setProperty('--dm-accent-rgb', `${r255}, ${g255}, ${b255}`);
  root.style.setProperty('--dm-secondary', secondaryHex);
}
