import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', ...fontFamily.sans],
        body: ['var(--font-body)', ...fontFamily.sans],
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
      animation: {
        'bounce-once': 'bounce-once 0.5s ease-in-out',
      },
      keyframes: {
        'bounce-once': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
      },
    },
  },
  plugins: [],
};
