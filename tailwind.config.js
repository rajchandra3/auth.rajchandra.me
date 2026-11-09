/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: {
          deep: '#07080d',
          bg: '#0b0d14',
          card: '#11141c',
          raised: '#1a1e28',
          primary: '#eef0f5',
          secondary: '#a3a9b8',
          muted: '#7a8296',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
        },
        semantic: {
          positive: '#4cc38a',
          negative: '#e5484d',
          warning: '#f59e0b',
        },
      },
      transitionTimingFunction: {
        unslop: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
