/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#020617',
        panel: '#020617',
        cyan: '#06b6d4',
        lime: '#c8ff6b',
        amber: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'Cairo', 'sans-serif'],
        display: ['Orbitron', 'Inter', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        arabic: ['Cairo', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 28px rgba(6, 182, 212, 0.18)',
      },
    },
  },
  plugins: [],
};
