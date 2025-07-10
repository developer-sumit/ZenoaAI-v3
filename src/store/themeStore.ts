import {create} from 'zustand';
import {MMKV} from 'react-native-mmkv';
import {persist, createJSONStorage, StateStorage} from 'zustand/middleware';

const storage = new MMKV();

const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: name => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: name => {
    return storage.delete(name);
  },
};

export interface Theme {
  primary: string;
  surface: string;
  background: string;
  text: string;
  secondaryText: string;
}

export const lightTheme: Theme = {
  primary: '#0D9488',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#2D3548',
  secondaryText: '#6B7280',
};

export const darkTheme: Theme = {
  primary: '#0D9488',
  background: '#0A0E17',
  surface: '#1A1F2C',
  text: '#FFFFFF',
  secondaryText: '#8C93A3',
};

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  currentTheme: Theme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  getThemeColors: () => Theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      currentTheme: lightTheme,
      isDark: false,

      setMode: (mode: ThemeMode) => {
        const isDark = mode === 'dark';
        const currentTheme = isDark ? darkTheme : lightTheme;

        set({mode, isDark, currentTheme});
      },

      toggleTheme: () => {
        const {isDark} = get();
        const newMode: ThemeMode = isDark ? 'light' : 'dark';
        const newTheme = isDark ? lightTheme : darkTheme;

        set({mode: newMode, isDark: !isDark, currentTheme: newTheme});
      },

      getThemeColors: () => {
        return get().currentTheme;
      },
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

export const useTheme = () => {
  const {currentTheme, isDark, mode, setMode, toggleTheme} = useThemeStore();

  return {theme: currentTheme, isDark, mode, setMode, toggleTheme};
};

// Utility function to create themed styles
export const createThemedStyles = <T extends Record<string, any>>(
  styleCreator: (theme: Theme) => T,
) => {
  return (theme: Theme): T => styleCreator(theme);
};
