// Tailwind CSS 4 moved its PostCSS plugin to the
// `@tailwindcss/postcss` package. Configure PostCSS
// to use that plugin along with Autoprefixer.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
