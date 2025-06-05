// Tailwind CSS 4 moved its PostCSS plugin to the
// `@tailwindcss/postcss` package. Configure PostCSS
// to use that plugin along with Autoprefixer.
module.exports = {
  // Use the new Tailwind CSS PostCSS plugin explicitly.
  // Array syntax avoids issues resolving scoped package names
  // across different build tools.
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
};
