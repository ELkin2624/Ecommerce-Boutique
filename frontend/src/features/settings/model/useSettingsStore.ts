import { create } from 'zustand';
import { apiClient } from '@/shared/api/axios-client';
import { DEFAULT_USER_SETTINGS, type UserSettings } from './settings.types';

interface SettingsState {
  currentUserId: string | null;
  settings: UserSettings;

  // Acciones
  loadUserSettings: (userId: string | null, serverPreferences?: Record<string, any>) => void;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  resetToDefaults: () => void;
  applySettingsToDOM: () => void;
}

function getStorageKey(userId: string | null): string {
  return userId ? `boutique_user_settings_${userId}` : 'boutique_guest_settings';
}

/** Aplica los atributos visuales con transición fluida al DOM (CSS variables, tamaño de fuente y clases). */
export function applySettings(settings: UserSettings) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Tema (Light, Dark, System)
  const isDark =
    settings.theme === 'system'
      ? Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      : settings.theme === 'dark';

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', settings.theme);

  // 2. Tipografía
  root.setAttribute('data-font', settings.fontFamily);

  // 3. Tamaño de fuente fluido tipo volumen en px
  const clampedSize = Math.max(12, Math.min(20, Number(settings.fontSize) || 15));
  root.style.fontSize = `${clampedSize}px`;
  root.setAttribute('data-font-size-px', String(clampedSize));

  // 4. Color de Acento
  root.setAttribute('data-accent', settings.accentColor);

  // 5. Modo Alto Rendimiento / Reducción de animaciones y filtros pesados
  if (settings.reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
}

// Helper para guardar en BD con debounce para no saturar la red al deslizar el slider
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
function syncWithDatabase(settings: UserSettings, userId: string | null) {
  if (!userId) return;

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    try {
      await apiClient.patch('/auth/preferences', settings);
    } catch {
      // Ignorar fallo de red silenciosamente (se mantiene en localStorage)
    }
  }, 400);
}

function loadSavedSettingsFromStorage(userId: string | null): UserSettings {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_USER_SETTINGS, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_USER_SETTINGS;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currentUserId: null,
  settings: DEFAULT_USER_SETTINGS,

  loadUserSettings: (userId: string | null, serverPreferences?: Record<string, any>) => {
    const hasServerPrefs = Boolean(serverPreferences && Object.keys(serverPreferences).length > 0);
    const settingsToUse: UserSettings = hasServerPrefs
      ? ({ ...DEFAULT_USER_SETTINGS, ...serverPreferences } as UserSettings)
      : loadSavedSettingsFromStorage(userId);

    if (hasServerPrefs) {
      try {
        localStorage.setItem(getStorageKey(userId), JSON.stringify(settingsToUse));
      } catch {
        // Ignorar
      }
    }

    applySettings(settingsToUse);
    set({ currentUserId: userId, settings: settingsToUse });
  },

  updateSetting: (key, value) => {
    const nextSettings = {
      ...get().settings,
      [key]: value,
    };
    applySettings(nextSettings);

    const userId = get().currentUserId;
    const storageKey = getStorageKey(userId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextSettings));
    } catch {
      // Ignorar
    }

    // Sincronizar con la Base de Datos en PostgreSQL
    syncWithDatabase(nextSettings, userId);

    set({ settings: nextSettings });
  },

  updateSettings: (partial) => {
    const nextSettings = {
      ...get().settings,
      ...partial,
    };
    applySettings(nextSettings);

    const userId = get().currentUserId;
    const storageKey = getStorageKey(userId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextSettings));
    } catch {
      // Ignorar
    }

    // Sincronizar con la Base de Datos en PostgreSQL
    syncWithDatabase(nextSettings, userId);

    set({ settings: nextSettings });
  },

  resetToDefaults: () => {
    applySettings(DEFAULT_USER_SETTINGS);
    const userId = get().currentUserId;
    const storageKey = getStorageKey(userId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_USER_SETTINGS));
    } catch {
      // Ignorar
    }

    // Sincronizar reseteo con la BD
    syncWithDatabase(DEFAULT_USER_SETTINGS, userId);

    set({ settings: DEFAULT_USER_SETTINGS });
  },

  applySettingsToDOM: () => {
    applySettings(get().settings);
  },
}));
