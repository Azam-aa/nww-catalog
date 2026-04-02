import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Syne', ...fontFamily.sans],
        body: ['DM Sans', ...fontFamily.sans],
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        surface: {
          primary: '#ffffff',
          secondary: '#f8f8f6',
          tertiary: '#f0f0ec',
          border: '#e4e4e0',
        },
        ink: {
          primary: '#111110',
          secondary: '#6b6b66',
          muted: '#a0a09a',
        },
        dark: {
          primary: '#0d0d0b',
          secondary: '#1a1a17',
          tertiary: '#252521',
          border: '#2e2e2a',
        }
      },
      screens: {
        xs: '360px',
        sm: '480px',
        md: '768px',
        lg: '1024px',
      },
    },
  },
  plugins: [],
};
