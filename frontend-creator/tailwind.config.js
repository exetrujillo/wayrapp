// tailwind.config.js
const designTokens = require('../frontend-shared/design-tokens.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ...designTokens.colors,
      },
      fontFamily: {
        sans: designTokens.typography.fontFamily.primary.split(', '),
        mono: designTokens.typography.fontFamily.monospace.split(', '),
      },
      fontSize: {
        ...designTokens.typography.fontSize,
        // Keep existing heading sizes for compatibility
        'h1': ['2.25rem', { lineHeight: '2.5rem' }],
        'h2': ['1.875rem', { lineHeight: '2.25rem' }],
        'h3': ['1.5rem', { lineHeight: '2rem' }],
      },
      fontWeight: designTokens.typography.fontWeight,
      lineHeight: designTokens.typography.lineHeight,
      letterSpacing: designTokens.typography.letterSpacing,
      spacing: designTokens.spacing,
      borderRadius: {
        ...designTokens.borderRadius,
        component: designTokens.borderRadius.DEFAULT, // Create a specific utility for component radius
      },
      boxShadow: designTokens.shadows,
      zIndex: designTokens.zIndex,
      // Define keyframes for animations
      keyframes: {
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOutUp: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
      },
      // Define animation utilities
      animation: {
        'fade-in-down': 'fadeInDown 0.3s ease-out forwards',
        'fade-out-up': 'fadeOutUp 0.3s ease-in forwards',
      },
    },
  },
  plugins: [],
}