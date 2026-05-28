/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#18181b', light: '#27272a', dark: '#09090b' },
        accent: { DEFAULT: '#2563eb', light: '#3b82f6' },
        surface: { DEFAULT: '#ffffff', secondary: '#fafafa', tertiary: '#f4f4f5' },
        border: { DEFAULT: '#e4e4e7', light: '#f4f4f5' },
        'text-primary': '#18181b',
        'text-secondary': '#52525b',
        'text-tertiary': '#a1a1aa',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#6366f1',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'float': '0 8px 30px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
