import {create} from 'zustand';
import {MMKV} from 'react-native-mmkv';
import i18n from '@src/localization';
import {findBestLanguageTag} from 'react-native-localize';

const storage = new MMKV();

const getDeviceLanguage = (): string => {
  const supported = [
    'en',
    'hi',
    'pa',
    'mr',
    'es',
    'de',
    'id',
    'zh',
    'pt',
    'fr',
    'ta',
    'te',
    'ar',
  ];
  const best = findBestLanguageTag(supported);
  return best?.languageTag || 'en';
};

const getInitialLanguage = (): string => {
  const storedLanguage = storage.getString('language');
  return storedLanguage || getDeviceLanguage();
};

const initialLanguage = getInitialLanguage();
i18n.changeLanguage(initialLanguage);

type LanguageState = {
  language: string;
  refreshKey: number;
  setLanguage: (language: string) => void;
};

export const useLanguageStore = create<LanguageState>(set => ({
  language: initialLanguage,
  refreshKey: 0,
  setLanguage: (language: string) => {
    try {
      i18n.changeLanguage(language);
      storage.set('language', language);
      set(state => ({language, refreshKey: state.refreshKey + 1}));
    } catch (error) {
      console.error('Error setting language:', error);
    }
  },
}));
