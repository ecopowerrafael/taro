/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-space': '#050505',
        'mystic-purple': '#1A0B2E',
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
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(197,160,89,0.35), 0 14px 40px rgba(0, 0, 0, 0.55)',
        innerGlow: 'inset 0 0 0 1px rgba(197,160,89,0.25)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
