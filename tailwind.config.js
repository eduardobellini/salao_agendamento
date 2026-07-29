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
      boxShadow: {
        'soft': '0 4px 40px -2px rgba(0, 0, 0, 0.04)',
        'float': '0 10px 40px -10px rgba(29, 158, 117, 0.15)',
      },
    },
  },
  plugins: [],
}
