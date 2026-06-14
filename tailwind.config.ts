/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#F5C400',
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#F5C400',
          600: '#d97706',
        },
        navy: {
          DEFAULT: '#0d1117',
          50:  '#f0f4f8',
          100: '#d0d8e4',
          200: '#8a95a3',
          300: '#4a5568',
          400: '#2a3445',
          500: '#1e2a3a',
          600: '#161d27',
          700: '#0d1117',
          800: '#232c38',
        },
        success: '#22c55e',
        danger:  '#e53935',
        warning: '#ff6b35',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'shimmer':   'shimmer 2.5s ease-in-out infinite',
        'glow':      'glow 3s ease-in-out infinite',
        'fade-in':   'fadeIn .25s ease',
        'slide-up':  'slideUp .3s ease',
        'bounce-in': 'bounceIn .5s ease',
      },
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        glow: {
          '0%,100%': { boxShadow: '0 0 8px rgba(245,196,0,.3)' },
          '50%':     { boxShadow: '0 0 22px rgba(245,196,0,.6)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(.4)',    opacity: '0' },
          '60%':  { transform: 'scale(1.15)'               },
          '80%':  { transform: 'scale(.95)'                },
          '100%': { transform: 'scale(1)',     opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
