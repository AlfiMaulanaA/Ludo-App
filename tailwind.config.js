/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif']
      },
      colors: {
        ludo: {
          red: '#ff4d6d',
          green: '#22c55e',
          yellow: '#ffc312',
          blue: '#3b82f6',
          purple: '#7c5cff',
          ink: '#1e293b'
        }
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(30, 41, 59, 0.18)',
        card: '0 4px 0 rgba(30, 41, 59, 0.06), 0 18px 40px -18px rgba(30, 41, 59, 0.25)'
      },
      animation: {
        'pop-in': 'popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'fade-up': 'fadeUp 0.45s ease-out both',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'float-emote': 'floatEmote 2.5s ease-out forwards',
        'bounce-piece': 'bouncePiece 0.7s ease-in-out infinite',
        'pulse-ring': 'pulseRing 1.4s ease-out infinite',
        wiggle: 'wiggle 0.6s ease-in-out infinite',
        'spin-slow': 'spin 6s linear infinite'
      },
      keyframes: {
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.85) translateY(12px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-18px) rotate(6deg)' }
        },
        floatEmote: {
          '0%': { opacity: '0', transform: 'translate(-50%, 10px) scale(0.5)' },
          '20%': { opacity: '1', transform: 'translate(-50%, -10px) scale(1.3)' },
          '80%': { opacity: '1', transform: 'translate(-50%, -50px) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -80px) scale(0.8)' }
        },
        bouncePiece: {
          '0%, 100%': { translate: '0 0' },
          '50%': { translate: '0 -22%' }
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.9), 0 0 0 0 rgba(255, 195, 18, 0.9)' },
          '100%': { boxShadow: '0 0 0 14px rgba(255, 255, 255, 0), 0 0 0 22px rgba(255, 195, 18, 0)' }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' }
        }
      }
    }
  },
  plugins: []
};
