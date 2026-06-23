/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./apps/web/app/**/*.{js,ts,jsx,tsx}",
    "./apps/web/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#006A38',
      },
    },
  },
  plugins: [],
};