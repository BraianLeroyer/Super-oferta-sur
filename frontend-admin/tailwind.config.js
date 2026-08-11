/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        anonima: {
          red: '#D91F26',
          darkred: '#B01319',
          navy: '#0F172A',
          border: '#E2E8F0'
        }
      }
    },
  },
  plugins: [],
}
