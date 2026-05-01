import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['"Cairo"', '"Tajawal"', 'sans-serif'],
      },
      backgroundImage: {
        'clinic-pattern':
          'radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.18), transparent 40%), radial-gradient(circle at 85% 5%, rgba(8, 145, 178, 0.18), transparent 35%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #0b1120 100%)',
        'glass-sheen': 'linear-gradient(120deg, rgba(255,255,255,0.08), rgba(255,255,255,0))',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(15, 23, 42, 0.35)',
        card: '0 20px 45px rgba(15, 23, 42, 0.4)',
      },
      spacing: {
        'sidebar-collapsed': '72px',
        'sidebar-expanded': '280px',
        'header-height': '72px',
      },
    },
  },
  daisyui: {
    themes: [
      {
        'clinic-dark': {
          primary: '#1e40af',
          'primary-content': '#eff6ff',
          secondary: '#0891b2',
          accent: '#0d9488',
          neutral: '#0f172a',
          'base-100': '#0f172a',
          'base-200': '#111827',
          'base-300': '#1f2937',
          'base-content': '#e2e8f0',
          info: '#06b6d4',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
        'clinic-light': {
          primary: '#1e40af',
          'primary-content': '#eff6ff',
          secondary: '#0891b2',
          accent: '#0d9488',
          neutral: '#0f172a',
          'base-100': '#ffffff',
          'base-200': '#f8fafc',
          'base-300': '#e2e8f0',
          'base-content': '#0f172a',
          info: '#0284c7',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
    ],
  },
  plugins: [daisyui],
};
