import {useTranslation} from 'react-i18next';
import {useLanguageStore} from '@src/store/languageStore';

export const useStrings = () => {
  const {language, refreshKey} = useLanguageStore();
  const {t, i18n} = useTranslation();

  // Ensure language is synced
  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }

  // Return t function for translations
  return t;
};
