/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pure white background
        'bg-white': '#ffffff',

        // Text Colors - High Contrast
        'text-dark': '#1a202c',
        'text-gray': '#4a5568',
        'text-light': '#718096',

        // Colorful Accents
        'purple-primary': '#667eea',
        'purple-secondary': '#764ba2',
        'pink-primary': '#f093fb',
        'pink-secondary': '#f5576c',
        'blue-primary': '#4facfe',
        'blue-secondary': '#00f2fe',
        'orange-primary': '#fa709a',
        'orange-secondary': '#fee140',
        'green-primary': '#84fab0',
        'green-secondary': '#8fd3f4',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-pink': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-blue': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-orange': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'gradient-green': 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
        'gradient-peach': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      },
      boxShadow: {
        'premium': '0 10px 40px rgba(0, 0, 0, 0.1)',
        'premium-lg': '0 20px 60px rgba(0, 0, 0, 0.15)',
        'card-purple': '0 10px 40px rgba(102, 126, 234, 0.3)',
        'card-pink': '0 10px 40px rgba(240, 147, 251, 0.3)',
        'card-blue': '0 10px 40px rgba(79, 172, 254, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
        'talking': 'talking 0.8s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(0)', opacity: '1' },
          to: { transform: 'translateY(-100%)', opacity: '0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        talking: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}