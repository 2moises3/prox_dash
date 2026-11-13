/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        discovery: '#7756c5',
        // ── PROXVEL Brand ─────────────────────────────────────────────────
        navy: {
          50:  '#eef2fb',
          100: '#d5e0f5',
          200: '#abbfe9',
          300: '#7a9ddd',
          400: '#4a7bd1',
          500: '#2659c5',
          600: '#1a4ab0',
          700: '#163d8e',
          800: '#102c6b',
          900: '#1a1f2e', // Primary navy
          950: '#070d1a',
        },
        gold: {
          50:  '#fdf8ec',
          100: '#faedcc',
          200: '#f4d895',
          300: '#edc260',
          400: '#ffcd4d',
          500: '#fdba00', // Primary gold
          600: '#c0841a',
          700: '#9e6b14',
          800: '#7c5410',
          900: '#5a3d0b',
          950: '#3a2706',
        },
        // ── Legacy (mantener para componentes semánticos) ──────────────────
        jungle: {
          50: '#eefdf3', 100: '#d6f9e2', 200: '#aff1c8', 300: '#79e3a6',
          400: '#3fcd7f', 500: '#1bb364', 600: '#0e9151', 700: '#0c7343',
          800: '#0d5b38', 900: '#0c4b30', 950: '#022c1a',
        },
        lake: {
          50: '#eff8ff', 100: '#dbeefe', 200: '#bfe2fe', 300: '#93d0fd',
          400: '#60b4fa', 500: '#3b95f6', 600: '#2477eb', 700: '#1c60d8',
          800: '#1d4faf', 900: '#1d448a', 950: '#172b54',
        },
        sand: {
          50: '#fbf8f1', 100: '#f5edda', 200: '#ead9b4', 300: '#dcbf85',
          400: '#d0a55e', 500: '#c68f44', 600: '#b87838', 700: '#995f30',
          800: '#7d4d2d', 900: '#674028', 950: '#382013',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft:    '0 2px 8px -2px rgba(14,23,48,0.08), 0 4px 16px -4px rgba(14,23,48,0.06)',
        'soft-lg': '0 8px 30px -6px rgba(14,23,48,0.14)',
        gold:    '0 0 0 2px rgba(216,155,31,0.35)',
        navy:    '0 4px 24px -4px rgba(14,23,48,0.28)',
      },
      keyframes: {
        'fade-in':   { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up':  { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-left': { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer:     { '100%': { transform: 'translateX(100%)' } },
        pulse_gold:  { '0%,100%': { boxShadow: '0 0 0 0 rgba(216,155,31,0)' }, '50%': { boxShadow: '0 0 0 6px rgba(216,155,31,0.18)' } },
      },
      animation: {
        'fade-in':       'fade-in 0.3s ease-out',
        'slide-up':      'slide-up 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-left': 'slide-in-left 0.35s cubic-bezier(0.16,1,0.3,1)',
        'pulse-gold':    'pulse_gold 2s infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
