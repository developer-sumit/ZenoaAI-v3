module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    ['module-resolver', {root: ['./'], alias: {'@src': './src'}}],
    'transform-remove-console',
    'react-native-reanimated/plugin',
  ],
};
