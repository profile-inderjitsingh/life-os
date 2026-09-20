/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // SF Pro on Apple devices, graceful fallbacks everywhere else.
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Helvetica Neue"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        rounded: ['"SF Pro Rounded"', '-apple-system', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Apple system colours (light / dark pair handled via CSS vars where needed)
        ios: {
          blue: '#0A84FF',
          green: '#30D158',
          indigo: '#5E5CE6',
          orange: '#FF9F0A',
          pink: '#FF375F',
          purple: '#BF5AF2',
          red: '#FF453A',
          teal: '#40C8E0',
          yellow: '#FFD60A',
          mint: '#66D4CF',
        },
        surface: {
          light: '#FFFFFF',
          'light-alt': '#F2F2F7',
          dark: '#000000',
          'dark-alt': '#1C1C1E',
          'dark-3': '#2C2C2E',
        },
      },
      borderRadius: {
        sheet: '32px',
        card: '22px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.18)',
        sheet: '0 -8px 40px rgba(0,0,0,0.28)',
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
