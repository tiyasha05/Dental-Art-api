module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%':   { transform: 'translate(0, 0)' },
          '25%':  { transform: 'translate(10px, -10px)' },
          '50%':  { transform: 'translate(0, -20px)' },
          '75%':  { transform: 'translate(-10px, -10px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
      },
    },
  },
  plugins: [],
}
