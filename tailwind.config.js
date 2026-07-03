/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        surface: {
          main: '#f8fafc', // معادل slate-50
          card: '#ffffff',
          muted: '#f1f5f9', // معادل slate-100
          glass: 'rgba(255, 255, 255, 0.25)' // افکت شیشه‌ای
        },
        primary: {
          main: '#4f46e5', // معادل indigo-600
          light: '#e0e7ff' // معادل indigo-100
        },
        text: {
          primary: '#1e293b', // معادل slate-800
          secondary: '#334155', // معادل slate-700
          muted: '#64748b', // معادل slate-500
          inverse: '#ffffff'
        },
        status: {
          success: { main: '#10b981', light: '#d1fae5' },
          danger: { main: '#f43f5e', light: '#ffe4e6' }
        },
        badge: {
          muzi: { main: '#f59e0b', light: '#fef3c7' },
          streak: { main: '#f97316', light: '#ffedd5' }
        }
      },
      fontFamily: {
        main: ['Vazirmatn', 'sans-serif']
      }
    }
  },
  plugins: []
};
