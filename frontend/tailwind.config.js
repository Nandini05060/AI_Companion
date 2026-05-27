/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0B0B',
        surface: '#1A1A1A',
        primary: '#8B0000',
        primaryHover: '#B11226',
        text: '#FFFFFF',
        textDim: '#A3A3A3',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '20px',
      }
    },
  },
  plugins: [],
}
