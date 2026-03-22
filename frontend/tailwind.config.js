/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          void:    '#020D05',
          deep:    '#040F07',
          dark:    '#071A0C',
          mid:     '#0D2914',
          border:  '#1A4A25',
          hover:   '#1F5C2E',
          leaf:    '#22C55E',
          moss:    '#16A34A',
          forest:  '#15803D',
          canopy:  '#166534',
          glow:    '#4ADE80',
          mint:    '#86EFAC',
          lime:    '#A3E635',
          sun:     '#FDE047',
          pollen:  '#FCD34D',
          amber:   '#F59E0B',
          soil:    '#92400E',
          bark:    '#78350F',
          danger:  '#EF4444',
          warn:    '#F97316',
          water:   '#38BDF8',
        }
      },
      fontFamily: {
        display: ["'Exo 2'", 'sans-serif'],
        mono:    ["'Share Tech Mono'", 'monospace'],
        body:    ["'Inter'", 'sans-serif'],
      },
      animation: {
        'grow':      'grow 2s ease-out forwards',
        'pulse-eco': 'pulseEco 3s ease infinite',
        'vine':      'vineGrow 3s ease-out forwards',
        'float-up':  'floatUp 4s ease infinite',
        'chloro':    'chlorophyll 4s ease infinite',
      }
    },
  },
  plugins: [],
}
