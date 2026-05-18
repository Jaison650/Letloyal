import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#028090',
          dark: '#014451',
          light: '#e6f4f6',
        },
        accent: {
          DEFAULT: '#02C39A',
          light: '#05FFCE',
          muted: 'rgba(2,195,154,0.15)',
        },
        brand: {
          bg: '#FAFBFC',
          white: '#FFFFFF',
          border: '#E2E8F0',
        },
        text: {
          dark: '#1A1A1A',
          medium: '#4A5568',
          light: '#A0AEC0',
        },
        status: {
          success: '#2E7D32',
          warning: '#F57C00',
          error: '#D32F2F',
        },
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      },
      boxShadow: {
        card: '0 4px 25px rgba(2,128,144,0.08)',
        'card-hover': '0 8px 40px rgba(2,128,144,0.15)',
        btn: '0 8px 25px rgba(2,195,154,0.30)',
        'btn-hover': '0 12px 30px rgba(2,195,154,0.40)',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(2,195,154,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(2,195,154,0)' },
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
