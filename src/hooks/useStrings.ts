import {useEffect, useState} from 'react';
import {useLanguageStore} from '@src/store/languageStore';
import strings from '@src/localization';

export const useStrings = () => {
  const {language, refreshKey} = useLanguageStore();
  const [currentStrings, setCurrentStrings] = useState(strings);

  useEffect(() => {
    strings.setLanguage(language);
    setCurrentStrings({...strings}); // Create new object reference to force re-render
  }, [language, refreshKey]);

  return currentStrings;
};
