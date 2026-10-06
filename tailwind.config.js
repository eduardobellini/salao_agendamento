/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        // Verde-mar dessaturado — a única cor de destaque do app
        brand: {
          50:  '#f1f6f3',
          100: '#dfece6',
          200: '#bfd8cd',
          300: '#94bcab',
          400: '#5f9a83',
          500: '#2f7a63',
          600: '#26654f',
          700: '#1e5141',
          800: '#173d31',
        },
        // Cinzas levemente quentes (areia), usados no lugar do cinza frio padrão
        gray: {
          50:  '#faf8f5',
          100: '#f3f0eb',
          200: '#e6e1d9',
          300: '#d2cbc0',
          400: '#a39b8f',
          500: '#776f64',
          600: '#5c554c',
          700: '#453f38',
          800: '#2e2a25',
          900: '#1f1c19',
        },
      },
      boxShadow: {
        'soft':  '0 1px 2px rgba(60, 45, 30, 0.04), 0 12px 40px -12px rgba(60, 45, 30, 0.10)',
        'float': '0 2px 4px rgba(30, 81, 65, 0.06), 0 24px 48px -16px rgba(30, 81, 65, 0.22)',
        'brand': '0 8px 20px -8px rgba(47, 122, 99, 0.55)',
      },
      zIndex: {
        nav: '40',
        modal: '50',
      },
      keyframes: {
        fadein: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideup: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        pop: {
          '0%':   { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        fadein: 'fadein .2s ease-out',
        slideup: 'slideup .28s cubic-bezier(.2,.8,.2,1)',
        pop: 'pop .22s cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
}
