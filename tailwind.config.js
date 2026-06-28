/** @type {import('tailwindcss').Config} */
module.exports = {
  // مسیر فایل‌هایی که از کلاس‌های تیل‌ویند استفاده می‌کنند
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {}
  },
  plugins: []
};
