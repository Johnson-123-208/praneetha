/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-navy': '#0a0918',
        'electric-cyan': '#70d6ff',
        'vibrant-magenta': '#ff70a6',
        'lavender': '#9d8df1',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        'lg': '16px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(255, 112, 166, 0.5)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(255, 112, 166, 0.8)',
            transform: 'scale(1.05)'
          },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(250px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(250px) rotate(-360deg)' },
        },
      },
    },
  },
  plugins: [],
}