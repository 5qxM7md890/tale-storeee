import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#04020A' },
        surface: '#090612',
        card: '#0D0917',
        border: 'rgba(196,181,253,0.18)',
        brand: { DEFAULT: '#8B5CF6', soft: '#C4B5FD' }
      },
      boxShadow: {
        brand: '0 18px 48px rgba(139,92,246,0.32)'
      }
    }
  },
  plugins: []
} satisfies Config;
