/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './admni/**/*.html', './admin/**/*.html'],
  theme: {
    extend: {
      colors: {
        roof: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          accent: '#ea580c',
          'accent-hover': '#c2410c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
