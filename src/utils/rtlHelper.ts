import {I18nManager} from 'react-native';

export const isRTL = (): boolean => {
  return I18nManager.isRTL;
};

export const configureRTL = (language: string): void => {
  const rtlLanguages = ['ar', 'he', 'ur']; // Arabic, Hebrew, Urdu

  const shouldBeRTL = rtlLanguages.includes(language);

  if (shouldBeRTL !== I18nManager.isRTL) {
    I18nManager.forceRTL(shouldBeRTL);
  }
};
