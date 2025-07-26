import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {findBestLanguageTag} from 'react-native-localize';

// Translataions
import {en} from './translations/en';
import {hi} from './translations/hi';
import {pa} from './translations/pa';
import {mr} from './translations/mr';
import {es} from './translations/es';
import {de} from './translations/de';
import {id} from './translations/id';
import {zh} from './translations/zh';
import {pt} from './translations/pt';
import {fr} from './translations/fr';
import {ta} from './translations/ta';
import {te} from './translations/te';
import {ar} from './translations/ar';

// Map translations for i18next
const resources = {
  en: {translation: en},
  hi: {translation: hi},
  pa: {translation: pa},
  mr: {translation: mr},
  es: {translation: es},
  de: {translation: de},
  id: {translation: id},
  zh: {translation: zh},
  pt: {translation: pt},
  fr: {translation: fr},
  ta: {translation: ta},
  te: {translation: te},
  ar: {translation: ar},
};

// Detect device language
const fallbackLng = 'en';
const bestLang =
  findBestLanguageTag(Object.keys(resources))?.languageTag || fallbackLng;

i18n.use(initReactI18next).init({
  resources,
  lng: bestLang,
  fallbackLng,
  compatibilityJSON: 'v4',
  interpolation: {escapeValue: false},
});

export default i18n;
