import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
       colors: {
         /**
          * Update the base color palette to match the light, modern aesthetic of the Alramz website.
          * The primary brand color is a warm brown (#C79B67) with a lighter variant for subtle accents.
          * The default background is a light beige (#FDFCF9) with slightly darker surfaces and cards.
          * Borders are semi-transparent to maintain soft separation between elements.
          */
         bg: { DEFAULT: '#FDFCF9' },
         surface: '#F8F4EF',
         card: '#FCF6EE',
         border: 'rgba(199,155,103,0.2)',
         brand: { DEFAULT: '#C79B67', soft: '#E8D4B8' },
         text: '#2E2E2E'
       },
       boxShadow: {
         brand: '0 18px 48px rgba(199,155,103,0.32)'
       }
    }
  },
  plugins: []
} satisfies Config;
