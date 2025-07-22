/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F7F8',
          100: '#B3E8EB',
          500: '#50A8B1', // Main brand color
          600: '#3A8086',
          700: '#2D6469',
        },
        secondary: {
          50: '#FEFEFE',
          100: '#F8F8F8', // Off-white
          200: '#E8E8E8',
        },
        neutral: {
          100: '#E0E0E0',
          300: '#B0B0B0',
          500: '#707070',
          700: '#404040',
          900: '#1A1A1A',
        },
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
      },
      fontFamily: {
        sans: ['Lato', 'Open Sans', 'Roboto', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1': '2.5rem',
        'h2': '2rem',
        'h3': '1.5rem',
        'body': '1rem',
        'small': '0.875rem',
        'xs': '0.75rem',
      },
      spacing: {
        'xs': '0.25rem',  // 4px
        'sm': '0.5rem',   // 8px
        'md': '1rem',     // 16px
        'lg': '1.5rem',   // 24px
        'xl': '2rem',     // 32px
        'xxl': '3rem',    // 48px
      },
      borderRadius: {
        'component': '0.5rem', // 8px for components
      }
    }
  },
  plugins: [],
}