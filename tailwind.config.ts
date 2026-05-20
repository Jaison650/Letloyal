import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '375px',   // iPhone SE / small Android
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D9488',
          dark: '#134E4A',
          light: '#CCFBF1',
        },
        accent: {
          DEFAULT: '#5EEAD4',
          mid: '#14B8A6',
          muted: 'rgba(94,234,212,0.15)',
        },
        brand: {
          bg: '#F8FAFC',
          white: '#FFFFFF',
          border: '#E2E8F0',
          navy: '#0F172A',
        },
        text: {
          dark: '#0F172A',
          medium: '#64748B',
          light: '#94A3B8',
        },
        status: {
          success: '#2E7D32',
          warning: '#F57C00',
          error: '#D32F2F',
        },
      },
      fontFamily: {
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '14px',
        '3xl': '28px',
        '4xl': '36px',
      },
      boxShadow: {
        card: '0 4px 25px rgba(13,148,136,0.08)',
        'card-hover': '0 8px 40px rgba(13,148,136,0.15)',
        btn: '0 8px 25px rgba(94,234,212,0.30)',
        'btn-hover': '0 12px 30px rgba(94,234,212,0.40)',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
        'count-up': 'countUp 1.2s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'progress-fill': 'progressFill 0.8s ease-out',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(94,234,212,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(94,234,212,0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        progressFill: {
          '0%': { width: '0%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
