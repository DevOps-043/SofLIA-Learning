const fontFamily = {
  heading: ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
  body: ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
  sans: ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
}

const fontSize = {
  h1: ['40px', { lineHeight: '1.5', letterSpacing: '0.02em', fontWeight: '700' }],
  h2: ['28px', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '700' }],
  subtitle: ['20px', { lineHeight: '1.5', fontWeight: '500' }],
  body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
  'body-small': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
  ui: ['14px', { lineHeight: '1.5', fontWeight: '500' }],
  'ui-small': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
  'body-large': ['18px', { lineHeight: '1.5', fontWeight: '400' }],
  small: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
}

module.exports = {
  fontFamily,
  fontSize,
}
