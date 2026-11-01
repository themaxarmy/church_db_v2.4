/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // `dark` on <html> is set from the saved choice or the system setting (see src/lib/theme.ts).
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
};
