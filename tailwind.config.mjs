/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Public Sans Variable"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Design tokens. Status colours encode the built / pipeline / stalled split used everywhere.
        mist: '#F3F5F6',
        ink: '#15212C',
        muted: '#4D5B67',
        rule: '#D3DADF',
        cobalt: { DEFAULT: '#1D4ED8', dark: '#1E3A8A' },
        built: '#0B7A5F',
        pipeline: '#A35F00',
        stalled: '#65717C',
      },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [],
};
