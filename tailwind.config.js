/** @type {import('tailwindcss').Config} */

// Each colour is a CSS variable (an "R G B" triplet) set in src/index.css for light and dark, so
// components use one class (e.g. `bg-surface`) and dark mode comes from the variables, not `dark:` classes.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // `dark` on <html> is set from the saved choice or the system setting (see src/lib/theme.ts).
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        canvas: token('canvas'),
        surface: { DEFAULT: token('surface'), muted: token('surface-muted') },
        line: { DEFAULT: token('line'), strong: token('line-strong') },
        ink: { DEFAULT: token('ink'), muted: token('ink-muted'), subtle: token('ink-subtle') },
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          soft: token('primary-soft'),
          text: token('primary-text'),
        },
        accent: {
          DEFAULT: token('accent'),
          text: token('accent-text'),
          soft: token('accent-soft'),
          line: token('accent-line'),
        },
        danger: {
          DEFAULT: token('danger'),
          hover: token('danger-hover'),
          text: token('danger-text'),
          soft: token('danger-soft'),
          line: token('danger-line'),
        },
        success: { text: token('success-text'), soft: token('success-soft'), line: token('success-line') },
        chip: { DEFAULT: token('chip'), text: token('chip-text') },
        avatar: {
          blue: token('avatar-blue'),
          'blue-text': token('avatar-blue-text'),
          orange: token('avatar-orange'),
          'orange-text': token('avatar-orange-text'),
        },
      },
    },
  },
  plugins: [],
};
