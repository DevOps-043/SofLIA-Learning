/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales de Aprende y Aplica usando CSS variables
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        carbon: {
          DEFAULT: 'var(--color-bg-dark)', // Carbón Digital base - cambia según el tema
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-bg-dark)',
          950: 'var(--color-gray-950)',
        },
        surface: 'rgba(15, 20, 25, 0.8)', // Superficie con transparencia
        border: 'rgba(255, 255, 255, 0.1)',
        
        // Colores semánticos
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        
        // Estados de módulos
        'status-locked': 'var(--status-locked)',
        'status-not-started': 'var(--status-not-started)',
        'status-in-progress': 'var(--status-in-progress)',
        'status-completed': 'var(--status-completed)',
      },
      fontFamily: {
        heading: ['Inter', 'Arial', 'Helvetica', 'sans-serif'], /* Inter como principal */
        body: ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
        sans: ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
      },
      fontSize: {
        'h1': ['40px', { lineHeight: '1.5', letterSpacing: '0.02em', fontWeight: '700' }], /* 32-40px, Bold, tracking abierto */
        'h2': ['28px', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '700' }], /* 24-28px, Bold/Semibold */
        'subtitle': ['20px', { lineHeight: '1.5', fontWeight: '500' }], /* 18-20px, Medium */
        'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }], /* 14-16px, Regular */
        'body-small': ['14px', { lineHeight: '1.5', fontWeight: '400' }], /* 14px, Regular */
        'ui': ['14px', { lineHeight: '1.5', fontWeight: '500' }], /* 12-14px, Medium */
        'ui-small': ['12px', { lineHeight: '1.5', fontWeight: '400' }], /* 12px, Regular */
        'body-large': ['18px', { lineHeight: '1.5', fontWeight: '400' }], /* Mantener para compatibilidad */
        'small': ['14px', { lineHeight: '1.5', fontWeight: '400' }], /* Mantener para compatibilidad */
      },
      spacing: {
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'base': '12px',
      },
      boxShadow: {
        'glass': '0 2px 8px rgba(0, 0, 0, 0.12)',
        'glass-hover': '0 4px 16px rgba(10, 37, 64, 0.2)', /* Azul Profundo */
        'glow': '0 0 20px rgba(0, 212, 179, 0.5)', /* Aqua para efectos glow */
        'glow-primary': '0 0 20px rgba(10, 37, 64, 0.3)', /* Azul Profundo */
        'glow-accent': '0 0 20px rgba(0, 212, 179, 0.4)', /* Aqua */
      },
      backdropBlur: {
        'glass': '8px',
      },
      animation: {
        'communities-orb-1': 'communitiesOrb1 10s ease-in-out infinite',
        'communities-orb-2': 'communitiesOrb2 8s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease',
        'slide-up': 'slideUp 0.5s ease',
        'slide-in': 'slideIn 0.3s ease',
        'shimmer': 'shimmer 2s infinite',
        'pulse': 'pulse 2s infinite',
        'button-shimmer': 'buttonShimmer 2s infinite',
        'button-bounce': 'buttonBounce 0.6s ease-in-out',
        'button-glow': 'buttonGlow 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'parallax-float': 'parallaxFloat 8s ease-in-out infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
        'shimmer-gradient': 'shimmerGradient 2s ease-in-out infinite',
        'slide-in-up': 'slideInUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
        'ripple': 'ripple 0.6s linear',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          'from': { transform: 'translateX(400px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        buttonShimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        buttonBounce: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' },
        },
        buttonGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 212, 179, 0.5)' }, /* Aqua */
          '50%': { boxShadow: '0 0 20px rgba(0, 212, 179, 0.8), 0 0 30px rgba(0, 212, 179, 0.6)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(5px) rotate(-1deg)' },
        },
        parallaxFloat: {
          '0%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-20px) translateX(10px)' },
          '100%': { transform: 'translateY(0px) translateX(0px)' },
        },
        borderGlow: {
          '0%': { borderColor: 'rgba(0, 212, 179, 0.3)', boxShadow: '0 0 5px rgba(0, 212, 179, 0.2)' }, /* Aqua */
          '50%': { borderColor: 'rgba(0, 212, 179, 0.6)', boxShadow: '0 0 15px rgba(0, 212, 179, 0.4)' },
          '100%': { borderColor: 'rgba(0, 212, 179, 0.3)', boxShadow: '0 0 5px rgba(0, 212, 179, 0.2)' },
        },
        shimmerGradient: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideInUp: {
          'from': { transform: 'translateY(30px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          'from': { transform: 'scale(0.9)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 212, 179, 0.3)' }, /* Aqua */
          '50%': { boxShadow: '0 0 20px rgba(0, 212, 179, 0.6), 0 0 30px rgba(0, 212, 179, 0.4)' },
        },
        communitiesOrb1: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(100px, -50px)' },
        },
        communitiesOrb2: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-50px, 50px)' },
        },
      },
    },
  },
  plugins: [],
}
