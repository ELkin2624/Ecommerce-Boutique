import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  tableDensity: 'compact' | 'comfortable';
  storeSettingsOpen: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setTableDensity: (density: 'compact' | 'comfortable') => void;
  setStoreSettingsOpen: (open: boolean) => void;
}

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem('fashionstore-ui');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.state?.theme === 'dark' || parsed?.state?.theme === 'light') {
        if (parsed.state.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return parsed.state.theme;
      }
    }
    // Detección automática del sistema operativo del usuario
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
      return 'dark';
    }
  } catch {
    // Fallback silencioso
  }
  document.documentElement.classList.remove('dark');
  return 'light';
}

const initialTheme = getInitialTheme();

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: initialTheme,
      tableDensity: 'comfortable',

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'light' ? 'dark' : 'light';
          if (next === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: next };
        }),
      setTableDensity: (density) => set({ tableDensity: density }),
      storeSettingsOpen: false,
      setStoreSettingsOpen: (open) => set({ storeSettingsOpen: open }),
    }),
    {
      name: 'fashionstore-ui',
    },
  ),
);
