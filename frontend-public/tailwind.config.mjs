/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        anonima: {
          red: '#D91F26',
          darkred: '#B01319',
          navy: '#0F172A',
          gray: '#F8FAFC',
          border: '#E2E8F0',
          yellow: '#FFB800'
        }
      }
    },
  },
  plugins: [],
}
