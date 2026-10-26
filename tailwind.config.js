/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Solarized Light scheme
        base3: '#FDF6E3',
        base2: '#eee8d5',
        base1: '#93a1a1',
        base0: '#839496',
        base00: '#657b83',
        base01: '#586e75',
        yellow: '#b58900',
        orange: '#cb4b16',
        red: '#dc322f',
        magenta: '#d33682',
        violet: '#6c71c4',
        blue: '#268bd2',
        cyan: '#2aa198',
        green: '#859900',

        // Semantic aliases
        warm: '#FDF6E3',
        surface: '#eee8d5',
        soft: '#839496',
        subtle: '#93a1a1',
        muted: '#657b83',
        text: '#586e75',
        accent: '#b58900',
        success: '#859900',
        'success-dark': '#718a00',
        info: '#268bd2',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
