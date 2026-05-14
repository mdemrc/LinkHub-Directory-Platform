/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Link-Base inspired color palette
        'lz-bg': '#1a1a2e',           // Dark background
        'lz-bg-light': '#16213e',      // Lighter background
        'lz-sidebar': '#0f0f23',       // Sidebar background
        'lz-header': '#0d1117',        // Header background
        'lz-border': '#2d2d44',        // Border color
        'lz-text': '#e4e4e7',          // Primary text
        'lz-text-muted': '#a1a1aa',    // Muted text
        'lz-accent': '#00d4ff',        // Accent/cyan
        'lz-accent-green': '#22c55e',  // Online status
        'lz-accent-red': '#ef4444',    // Offline/scam status
        'lz-accent-yellow': '#eab308', // Warning/premium
        'lz-link': '#60a5fa',          // Link color
        'lz-link-hover': '#93c5fd',    // Link hover
        'lz-highlight': '#dc2626',     // Highlighted text (sponsored)
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xxs': '0.65rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
