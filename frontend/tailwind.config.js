module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        light: {
          bgStart: '#fff7ed',
          bgEnd: '#fef9c3',
          accent: '#f97316',
          accent2: '#facc15'
        },
        dark: {
          bgStart: '#1f2937',
          bgEnd: '#111827',
          accent: '#fb923c',
          accent2: '#fde047'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
