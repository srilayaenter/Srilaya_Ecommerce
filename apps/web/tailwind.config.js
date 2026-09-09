/** @type {import('tailwindcss').Config} */

// Standard Tailwind recipe for CSS-variable-backed colors that still support
// opacity modifiers (e.g. bg-naturals-green/10). Variables are defined once,
// in app/globals.css, as space-separated RGB channels.
function withOpacity(variableName) {
  return ({ opacityValue }) =>
    opacityValue !== undefined
      ? `rgb(var(${variableName}) / ${opacityValue})`
      : `rgb(var(${variableName}))`;
}

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        naturals: {
          green: withOpacity('--naturals-green'),
          'green-dark': withOpacity('--naturals-green-dark'),
          'green-deep': withOpacity('--naturals-green-deep'),
          gold: withOpacity('--naturals-gold'),
          cream: withOpacity('--naturals-cream'),
          charcoal: withOpacity('--naturals-charcoal'),
          white: withOpacity('--naturals-white'),
        },
      },
    },
  },
  plugins: [],
}