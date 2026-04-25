import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-muted': 'var(--surface-muted)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        accent: 'var(--accent)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        'sidebar-bg': 'var(--sidebar-bg)',
        'sidebar-border': 'var(--sidebar-border)',
        'sidebar-text': 'var(--sidebar-text)',
        'sidebar-text-muted': 'var(--sidebar-text-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        brand: ['Orbitron', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: 'var(--shadow-sm)',
        elev: 'var(--shadow-md)',
        high: 'var(--shadow-lg)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
