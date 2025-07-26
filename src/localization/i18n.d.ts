import 'react-i18next';
import en from './translations/en';

declare module 'react-i18next' {
  type DefaultResources = typeof en;
  interface CustomTypeOptions {
    resources: DefaultResources;
    // Optionally, set defaultNS: 'translation';
  }
}
