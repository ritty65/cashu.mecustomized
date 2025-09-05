// Configure PostCSS to use the Tailwind CSS plugin from the new package
// alongside Autoprefixer.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
