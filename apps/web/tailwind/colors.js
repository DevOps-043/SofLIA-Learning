const withOpacity = (variableName) => ({ opacityValue } = {}) => {
  if (opacityValue === undefined) {
    return `rgb(var(${variableName}))`
  }

  return `rgb(var(${variableName}) / ${opacityValue})`
}

const colors = {
  primary: withOpacity('--color-primary-rgb'),
  'primary-hover': withOpacity('--color-primary-hover-rgb'),
  secondary: withOpacity('--color-secondary-rgb'),
  accent: withOpacity('--color-accent-rgb'),
  'accent-hover': withOpacity('--color-accent-hover-rgb'),
  carbon: {
    DEFAULT: withOpacity('--color-bg-dark-rgb'),
    700: withOpacity('--color-gray-700-rgb'),
    800: withOpacity('--color-gray-800-rgb'),
    900: withOpacity('--color-bg-dark-rgb'),
    950: withOpacity('--color-gray-950-rgb'),
  },
  surface: withOpacity('--color-surface-rgb'),
  border: withOpacity('--color-border-rgb'),
  success: withOpacity('--color-success-rgb'),
  warning: withOpacity('--color-warning-rgb'),
  error: withOpacity('--color-error-rgb'),
  info: withOpacity('--color-info-rgb'),
  muted: withOpacity('--color-muted-rgb'),
  'status-locked': withOpacity('--status-locked-rgb'),
  'status-not-started': withOpacity('--status-not-started-rgb'),
  'status-in-progress': withOpacity('--status-in-progress-rgb'),
  'status-completed': withOpacity('--status-completed-rgb'),
}

module.exports = { colors }
