import { useSyncExternalStore } from 'react';
import type { ModuleMode } from '../core/types';

export type WorkMode = 'OPERATOR' | 'MANAGER';
export type UiControl =
  | 'posterSubtitle'
  | 'posterPriceFrom'
  | 'posterPricePerMeasure'
  | 'posterBadge'
  | 'socialImage'
  | 'socialBullets'
  | 'socialCta'
  | 'hrReference'
  | 'hrRequirements'
  | 'hrCompensation'
  | 'hrContact';

export interface UiPrefs {
  version: 1;
  workMode: WorkMode;
  visibility: Record<ModuleMode, Partial<Record<UiControl, boolean>>>;
}

const STORAGE_KEY = 'alfa_pulso_ui_prefs_v1';

const defaultVisibility: UiPrefs['visibility'] = {
  STORE_POSTER: {
    posterSubtitle: true,
    posterPriceFrom: true,
    posterPricePerMeasure: true,
    posterBadge: true,
  },
  SOCIAL_MEDIA: {
    socialImage: true,
    socialBullets: true,
    socialCta: true,
  },
  CAROUSEL: {},
  HR_NOTICE: {
    hrReference: true,
    hrRequirements: true,
    hrCompensation: true,
    hrContact: true,
  },
  BRAND_HUB: {},
  CAMPAIGNS: {},
  CURATOR_QUEUE: {},
  BANNER_FAIXA: {},
  RADIO_SPOT: {},
};

const defaults: UiPrefs = {
  version: 1,
  workMode: 'OPERATOR',
  visibility: defaultVisibility,
};

let current: UiPrefs = defaults;
let loaded = false;
const listeners = new Set<() => void>();

function cloneDefaults(): UiPrefs {
  return {
    version: 1,
    workMode: defaults.workMode,
    visibility: {
      STORE_POSTER: { ...defaults.visibility.STORE_POSTER },
      SOCIAL_MEDIA: { ...defaults.visibility.SOCIAL_MEDIA },
      CAROUSEL: { ...defaults.visibility.CAROUSEL },
      HR_NOTICE: { ...defaults.visibility.HR_NOTICE },
      BRAND_HUB: {},
      CAMPAIGNS: {},
      CURATOR_QUEUE: {},
      BANNER_FAIXA: {},
      RADIO_SPOT: {},
    },
  };
}

function read(): UiPrefs {
  if (loaded || typeof window === 'undefined') return current;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return current;
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    if (parsed.version !== 1) return current;
    current = {
      version: 1,
      workMode: parsed.workMode === 'MANAGER' ? 'MANAGER' : 'OPERATOR',
      visibility: {
        STORE_POSTER: {
          ...defaults.visibility.STORE_POSTER,
          ...(parsed.visibility?.STORE_POSTER ?? {}),
        },
        SOCIAL_MEDIA: {
          ...defaults.visibility.SOCIAL_MEDIA,
          ...(parsed.visibility?.SOCIAL_MEDIA ?? {}),
        },
        CAROUSEL: { ...(parsed.visibility?.CAROUSEL ?? {}) },
        HR_NOTICE: {
          ...defaults.visibility.HR_NOTICE,
          ...(parsed.visibility?.HR_NOTICE ?? {}),
        },
        BRAND_HUB: { ...(parsed.visibility?.BRAND_HUB ?? {}) },
        CAMPAIGNS: { ...(parsed.visibility?.CAMPAIGNS ?? {}) },
        CURATOR_QUEUE: { ...(parsed.visibility?.CURATOR_QUEUE ?? {}) },
        BANNER_FAIXA: { ...(parsed.visibility?.BANNER_FAIXA ?? {}) },
        RADIO_SPOT: { ...(parsed.visibility?.RADIO_SPOT ?? {}) },
      },
    };
  } catch {
    current = cloneDefaults();
  }
  return current;
}

function persist(next: UiPrefs) {
  current = next;
  loaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* cota cheia: preferências continuam válidas em memória */
  }
  listeners.forEach((listener) => listener());
}

export function getUiPrefs(): UiPrefs {
  return read();
}

export function setWorkModePref(workMode: WorkMode) {
  persist({ ...read(), workMode });
}

export function toggleUiPref(module: ModuleMode, control: UiControl) {
  const prefs = read();
  const moduleVisibility = prefs.visibility[module] ?? {};
  persist({
    ...prefs,
    visibility: {
      ...prefs.visibility,
      [module]: {
        ...moduleVisibility,
        [control]: moduleVisibility[control] === false,
      },
    },
  });
}

export function isControlVisible(
  prefs: UiPrefs,
  module: ModuleMode,
  control: UiControl
) {
  return prefs.visibility[module]?.[control] !== false;
}

export function resetUiPrefs() {
  persist(cloneDefaults());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUiPrefs(): UiPrefs {
  return useSyncExternalStore(subscribe, getUiPrefs, getUiPrefs);
}
