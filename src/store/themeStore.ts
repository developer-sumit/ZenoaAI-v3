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

export interface ColorPalette {
  name: string;
  primary: string;
  lightSurface?: string;
  lightBackground?: string;
  darkSurface?: string;
  darkBackground?: string;
}

export const defaultColorPalettes: ColorPalette[] = [
  {
    name: 'Teal',
    primary: '#0D9488',
  },
  {
    name: 'Blue',
    primary: '#3B82F6',
  },
  {
    name: 'Purple',
    primary: '#8B5CF6',
  },
  {
    name: 'Pink',
    primary: '#EC4899',
  },
  {
    name: 'Orange',
    primary: '#F97316',
  },
  {
    name: 'Green',
    primary: '#10B981',
  },
  {
    name: 'Red',
    primary: '#EF4444',
  },
  {
    name: 'Indigo',
    primary: '#6366F1',
  },
  {
    name: 'Yellow',
    primary: '#F59E0B',
  },
  {
    name: 'Emerald',
    primary: '#059669',
  },
  {
    name: 'Rose',
    primary: '#F43F5E',
  },
  {
    name: 'Cyan',
    primary: '#06B6D4',
  },
];

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

const createThemeWithPalette = (palette: ColorPalette, isDark: boolean): Theme => {
  const baseTheme = isDark ? darkTheme : lightTheme;
  return {
    ...baseTheme,
    primary: palette.primary,
    surface: isDark 
      ? (palette.darkSurface || baseTheme.surface)
      : (palette.lightSurface || baseTheme.surface),
    background: isDark 
      ? (palette.darkBackground || baseTheme.background)
      : (palette.lightBackground || baseTheme.background),
  };
};

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  currentTheme: Theme;
  isDark: boolean;
  selectedPalette: ColorPalette;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setPalette: (palette: ColorPalette) => void;
  getThemeColors: () => Theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      currentTheme: lightTheme,
      isDark: false,
      selectedPalette: defaultColorPalettes[0], // Default to Teal

      setMode: (mode: ThemeMode) => {
        const isDark = mode === 'dark';
        const {selectedPalette} = get();
        const currentTheme = createThemeWithPalette(selectedPalette, isDark);

        set({mode, isDark, currentTheme});
      },

      toggleTheme: () => {
        const {isDark, selectedPalette} = get();
        const newMode: ThemeMode = isDark ? 'light' : 'dark';
        const newTheme = createThemeWithPalette(selectedPalette, !isDark);

        set({mode: newMode, isDark: !isDark, currentTheme: newTheme});
      },

      setPalette: (palette: ColorPalette) => {
        const {isDark} = get();
        const currentTheme = createThemeWithPalette(palette, isDark);
        
        set({selectedPalette: palette, currentTheme});
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
  const {currentTheme, isDark, mode, setMode, toggleTheme, selectedPalette, setPalette} = useThemeStore();

  return {
    theme: currentTheme, 
    isDark, 
    mode, 
    setMode, 
    toggleTheme, 
    selectedPalette, 
    setPalette,
    availablePalettes: defaultColorPalettes
  };
};

// Utility function to create themed styles
export const createThemedStyles = <T extends Record<string, any>>(
  styleCreator: (theme: Theme) => T,
) => {
  return (theme: Theme): T => styleCreator(theme);
};
