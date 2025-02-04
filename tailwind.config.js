/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        light: {
          primary: {
            // DEFAULT: '#9333ea',
            DEFAULT: '#fb5607',
            muted: '#f3e8ff',
            selected: '#000000',
          },
          secondary: {
            DEFAULT: '#e2e8f0',
            muted: '#e2e8f0',
            selected: '#000000',
          },
          text: {
            DEFAULT: '#475569',
            muted: '#475569',
            selected: '#000000',
          },
        },
        dark: {
          primary: {
            DEFAULT: '#581c87',
            muted: '#f3e8ff',
            selected: '#000000',
          },
          secondary: {
            DEFAULT: '#1f2937',
            muted: '#1f2937',
            selected: '#000000',
          },
          text: {
            DEFAULT: '#cbd5e1',
            muted: '#cbd5e1',
            selected: '#000000',
          },
        },
      },
    },
  },
  plugins: [],
};
