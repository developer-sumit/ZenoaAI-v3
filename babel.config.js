module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    ['module-resolver', {root: ['./'], alias: {'@zenoa': './src'}}],
    'react-native-reanimated/plugin',
  ],
};
