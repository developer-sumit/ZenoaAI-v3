import {Linking} from 'react-native';
import appConfig from '@src/config/app.config';

export const openTermsOfService = () => {
  Linking.openURL(`${appConfig.website}/terms`);
};

export const openPrivacyPolicy = () => {
  Linking.openURL(`${appConfig.website}/privacy`);
};
