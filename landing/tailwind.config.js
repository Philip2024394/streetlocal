/** @type {import('tailwindcss').Config} */
export default {
  // Scope utilities to `.tw-scope` and disable preflight so this file
  // doesn't reset the rest of the landing app (PremiumHome, DonutSellingPage).
  important: '.tw-scope',
  corePlugins: {
    preflight: false,
  },
  content: [
    './index.html',
    './src/PremiumSoftwareHomepage.jsx',
  ],
  theme: {
    extend: {
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
