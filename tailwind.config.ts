import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#050706' },
        surface: '#070B09',
        card: '#0A0F0C',
        border: 'rgba(255,255,255,0.10)',
        brand: { DEFAULT: '#10B981', soft: '#6EE7B7' }
      }
    }
  },
  plugins: []
} satisfies Config;
