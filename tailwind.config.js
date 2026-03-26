/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-space': '#050505',
        'mystic-black': '#0a0014',
        'mystic-purple-dark': '#2E0249',
        'mystic-purple': '#1A0B2E',
        'mystic-purple-light': '#A57CDB',
        'mystic-gold': '#D4AF37',
        'mystic-gold-light': '#FFF385',
        'stardust-gold': '#C5A059',
        'ethereal-silver': '#E5E7EB',
        mystic: {
          black: '#050505',
          purple: '#1A0B2E',
          gold: '#C5A059',
          goldSoft: '#E0C27A',
          violet: '#2E164F',
        },
      },
      backgroundImage: {
        'mystic-gradient':
          'radial-gradient(circle at top, rgba(197,160,89,0.20), transparent 45%), linear-gradient(180deg, #050505 0%, #120820 100%)',
        'premium-gradient': 'radial-gradient(ellipse at top, rgba(46, 2, 73, 0.4), #0a0014)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(197,160,89,0.35), 0 14px 40px rgba(0, 0, 0, 0.55)',
        innerGlow: 'inset 0 0 0 1px rgba(197,160,89,0.25)',
        'gold-glow': '0 0 15px rgba(212,175,55,0.2)',
        'gold-glow-lg': '0 0 25px rgba(212,175,55,0.4)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        display: ['"Playfair Display"', 'serif'],
        body: ['Lato', 'system-ui', 'sans-serif'],
        text: ['Noto Sans', 'system-ui', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
      },
    },
  },
  plugins: [],
}
