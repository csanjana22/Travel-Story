/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    fontFamily:{
      display: ['"Poppins"', 'sans-serif','CaveatBrush'],
      caveat: ['"Caveat Brush"', 'cursive'],
    },
    extend: {
      colors:{
        primary:"#05B6D3",
        secondary:"#EF863E",
      },
      backgroundImage: {
        'login-bg-img': "url('./src/assets/images/bg-image.png')",
        'signup-bg-img': "url('./src/assets/images/signup-bg-img.jpg')",
      },
  },
},
  plugins: [],
} 