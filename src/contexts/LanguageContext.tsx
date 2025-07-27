import React, {createContext, useContext, useState} from 'react';
import {useLanguageStore} from '@src/store/languageStore';
import {useTranslation} from 'react-i18next';

interface LanguageContextType {
  language: string;
  t: (key: string, options?: any) => string;
  forceUpdate: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const {language} = useLanguageStore();
  const {t, i18n} = useTranslation();
  const [, setUpdateCounter] = useState(0);

  const forceUpdate = () => setUpdateCounter(prev => prev + 1);

  // Sync language
  if (i18n.language !== language) {
    i18n.changeLanguage(language);
    forceUpdate();
  }

  return (
    <LanguageContext.Provider value={{language, t, forceUpdate}}>
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
