/** @type {import('tailwindcss').Config} */
const path = require("path");
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
        'brand-green': '#006837',
        'brand-yellow': '#FBB040',
      },
    },
  },
  plugins: [],
}