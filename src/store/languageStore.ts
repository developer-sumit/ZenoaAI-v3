import {create} from 'zustand';
import {MMKV} from 'react-native-mmkv';
import strings from '@src/localization';
import {NativeModules, Platform} from 'react-native';

const storage = new MMKV();

const getDeviceLanguage = (): string => {
  try {
    let deviceLanguage: string | undefined;

    if (Platform.OS === 'ios') {
      deviceLanguage =
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]; // iOS 13
    } else {
      deviceLanguage = NativeModules.I18nManager?.localeIdentifier;
    }

    // Safety check: ensure deviceLanguage is a string
    if (!deviceLanguage || typeof deviceLanguage !== 'string') {
      console.warn('Could not detect device language, defaulting to English');
      return 'en';
    }

    // e.g., 'en-US', 'hi-IN', 'es-ES', 'de-DE', 'zh-CN', 'id-ID', 'pt-BR', 'fr-FR', 'ta-IN', 'te-IN', 'ar-SA'
    const languageCode = deviceLanguage.split('-')[0];

    return [
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
    ].includes(languageCode)
      ? languageCode
      : 'en';
  } catch (error) {
    console.error('Error detecting device language:', error);
    return 'en'; // Fallback to English
  }
};

const getInitialLanguage = (): string => {
  try {
    const storedLanguage = storage.getString('language');
    return storedLanguage || getDeviceLanguage();
  } catch (error) {
    console.error('Error getting initial language:', error);
    return 'en'; // Fallback to English
  }
};

const initialLanguage = getInitialLanguage();
strings.setLanguage(initialLanguage);

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
      strings.setLanguage(language);
      storage.set('language', language);
      set(state => ({language, refreshKey: state.refreshKey + 1}));
    } catch (error) {
      console.error('Error setting language:', error);
    }
  },
}));
