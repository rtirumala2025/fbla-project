/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  important: true, // Add !important to all utility classes
  theme: {
    extend: {
      colors: {
        primary: '#FF8B5A',
        secondary: '#FFD166',
        accent: '#06D6A0',
        cream: '#FFF8F0',
        charcoal: '#2D3142',
        background: {
          DEFAULT: '#E7E7E7',
          light: '#E7E7E7',
          dark: '#1a202c',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      borderRadius: {
        pet: '12px',
      },
      boxShadow: {
        soft: '0 6px 18px rgba(45,49,66,0.08)'
      },
      backgroundColor: {
        DEFAULT: '#E7E7E7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
