import {create} from 'zustand';
import {MMKV} from 'react-native-mmkv';

const storage = new MMKV();

type ThemeState = {
  isDark: boolean;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeState>(set => ({
  isDark: storage.getBoolean('isDark') || false,
  toggleTheme: () => {
    set(state => {
      storage.set('isDark', !state.isDark);
      return {isDark: !state.isDark};
    });
  },
}));
