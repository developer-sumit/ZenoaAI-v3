/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import ConsoleRemover from './src/components/ConsoleRemover';

AppRegistry.registerComponent(appName, () => () => (
  <ConsoleRemover>
    <App />
  </ConsoleRemover>
));
