/** Tailwind v4-style config for premium green/white theme. */
module.exports = {
  content: ['./src/**/*.{html,ts,scss,css}'],
  theme: {
    extend: {
      colors: {
        primary: '#27AE60',
        primaryDark: '#2E7D32',
        accentLight: '#A5D6A7',
        surface: '#FFFFFF',
        surfaceMuted: '#F9FAFB'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(39, 174, 96, 0.08)',
        luxe: '0 20px 50px rgba(46, 125, 50, 0.15)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem'
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        ripple: 'ripple 0.6s ease-out'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: 0.5 },
          '100%': { transform: 'scale(4)', opacity: 0 }
        }
      }
    }
  },
  plugins: []
};
