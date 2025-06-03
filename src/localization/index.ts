import LocalizedStrings from 'react-native-localization';
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

// Create the localization object with all supported languages
const strings = new LocalizedStrings({
  en,
  hi,
  pa,
  mr,
  es,
  de,
  id,
  zh,
  pt,
  fr,
  ta,
  te,
  ar,
});

export const LocalizationProps = typeof strings;

export default strings;
