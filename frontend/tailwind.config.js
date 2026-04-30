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
          'radial-gradient(circle at 20% 15%, rgba(14, 116, 144, 0.15), transparent 40%), radial-gradient(circle at 80% 0%, rgba(13, 148, 136, 0.18), transparent 42%), linear-gradient(140deg, #f7fafc 0%, #edf6ff 45%, #ecfeff 100%)',
      },
    },
  },
  daisyui: {
    themes: [
      {
        clinic: {
          primary: '#0f766e',
          'primary-content': '#f0fdfa',
          secondary: '#0e7490',
          accent: '#1d4ed8',
          neutral: '#334155',
          'base-100': '#ffffff',
          'base-200': '#f1f5f9',
          'base-300': '#e2e8f0',
          'base-content': '#0f172a',
          info: '#0284c7',
          success: '#059669',
          warning: '#d97706',
          error: '#dc2626',
        },
      },
    ],
  },
  plugins: [daisyui],
};
