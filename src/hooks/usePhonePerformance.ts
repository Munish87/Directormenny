import { useSyncExternalStore } from 'react';

// Coarse input also covers phones held in landscape, regardless of viewport width.
const query = '(max-width: 767px), (pointer: coarse)';
let media: MediaQueryList | undefined;
const getMedia = () => media ??= window.matchMedia(query);
const subscribe = (notify: () => void) => {
  const list = getMedia();
  list.addEventListener('change', notify);
  return () => list.removeEventListener('change', notify);
};

export function usePhonePerformance() {
  return useSyncExternalStore(subscribe, () => getMedia().matches, () => true);
}
