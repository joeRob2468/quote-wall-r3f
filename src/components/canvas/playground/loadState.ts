import { useSyncExternalStore } from "react";

// How far the scene has got toward being on screen, for the boot overlay.
// Screens count themselves in when they mount and again once their content
// (which suspends on the screen font) has resolved, so `screensLoaded`
// catching up with `screensMounted` means the monitors have something to show.
export type LoadState = {
  sceneMounted: boolean;
  screensMounted: number;
  screensLoaded: number;
  // Everything mounted and a few frames drawn, so shaders have compiled
  ready: boolean;
};

const INITIAL_STATE: LoadState = {
  sceneMounted: false,
  screensMounted: 0,
  screensLoaded: 0,
  ready: false,
};

let state = INITIAL_STATE;
const listeners = new Set<() => void>();

const update = (patch: Partial<LoadState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getLoadState = () => state;

export const useLoadState = () =>
  useSyncExternalStore(subscribe, getLoadState, () => INITIAL_STATE);

// Each returns its own undo, for effect cleanups
export const markSceneMounted = () => {
  update({ sceneMounted: true });
  return () => update({ sceneMounted: false });
};
export const addMountedScreen = () => {
  update({ screensMounted: state.screensMounted + 1 });
  return () => update({ screensMounted: state.screensMounted - 1 });
};
export const addLoadedScreen = () => {
  update({ screensLoaded: state.screensLoaded + 1 });
  return () => update({ screensLoaded: state.screensLoaded - 1 });
};
// Once shown, the scene stays shown
export const markReady = () => {
  if (!state.ready) update({ ready: true });
};
