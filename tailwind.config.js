/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0fdf8',
          100: '#dcfbef',
          200: '#b9f7e0',
          500: '#1D9E75',
          600: '#178563',
          700: '#0F6E56',
        },
      },
    },
  },
  plugins: [],
}
