import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0b1120',
        surface: '#111827',
        border: '#1f2937',
        primary: '#60a5fa',
        secondary: '#22c55e',
        muted: '#94a3b8',
      },
    },
  },
  plugins: [],
};

export default config;
