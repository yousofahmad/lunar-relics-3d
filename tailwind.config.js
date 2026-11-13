/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#060a12',
        panel: '#0b1320',
        cyan: '#69e8ff',
        lime: '#c8ff6b',
        amber: '#ffbf69',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        arabic: ['IBM Plex Sans Arabic', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 28px rgba(105, 232, 255, 0.18)',
      },
    },
  },
  plugins: [],
};
