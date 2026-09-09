/** @type {import('tailwindcss').Config} */
const path = require("path");

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
  // Absolute paths: this config is loaded with an explicit path from
  // postcss.config.js (needed so Next.js's production build doesn't fall
  // back to auto-discovering the unrelated tailwind.config.js at the repo
  // root). Once loaded that way, relative content globs resolve against
  // process.cwd() instead of this file's directory, so they must be
  // anchored to __dirname to work regardless of the build's cwd.
  content: [
    path.join(__dirname, "app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "lib/**/*.{js,ts,jsx,tsx,mdx}"),
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