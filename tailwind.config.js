/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        // Colores principales de Aprende y Aplica
        primary: {
          DEFAULT: 'var(--color-legacy-0066cc)', // Azul Principal
          50: 'var(--color-legacy-e6f2ff)',
          100: 'var(--color-legacy-cce5ff)',
          500: 'var(--color-legacy-0066cc)',
          600: 'var(--color-legacy-0052a3)', // Azul más oscuro
          900: 'var(--color-legacy-0a0a0a)', // Carbón Digital
        },
        dark: 'var(--color-legacy-0a0a0a)', // Carbón Digital
        light: 'var(--color-legacy-f2f2f2)', // Gris Neblina
        white: 'var(--color-bg-light)', // Blanco Puro
        
        // Colores semánticos
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        heading: ['Montserrat', 'Arial', 'Helvetica', 'sans-serif'],
        body: ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '1.5', letterSpacing: '0.3px' }],
        'h2': ['24px', { lineHeight: '1.5', letterSpacing: '0.3px' }],
        'body': ['16px', { lineHeight: '1.5' }],
        'body-large': ['18px', { lineHeight: '1.5' }],
        'small': ['14px', { lineHeight: '1.5' }],
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
      },
      boxShadow: {
        'glass': '0 2px 8px rgba(0, 0, 0, 0.12)',
        'glass-hover': '0 4px 16px rgba(0, 102, 204, 0.2)',
      },
      backdropBlur: {
        'glass': '8px',
      },
    },
  },
  plugins: [],
}

