import React, {createContext, useContext, useEffect, useState} from 'react';

import {useLanguageStore} from '@src/store/languageStore';
import {useStrings} from '@src/hooks/useStrings';
import {LocalizationProps} from '@src/localization';

interface LanguageContextType {
  language: string;
  strings: typeof LocalizationProps;
  forceUpdate: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const strings = useStrings();
  const {language} = useLanguageStore();
  const [, setUpdateCounter] = useState(0);

  const forceUpdate = () => {
    setUpdateCounter(prev => prev + 1);
  };

  useEffect(() => {
    strings.setLanguage(language);
    forceUpdate();
  }, [language]);

  return (
    <LanguageContext.Provider value={{language, strings, forceUpdate}}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error(
      'useLanguageContext must be used within a LanguageProvider',
    );
  }
  return context;
};
