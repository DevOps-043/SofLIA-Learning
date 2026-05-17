export function redactSensitiveText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[telefono]')
    .replace(/\b[A-Z0-9._%+-]{24,}\b/gi, '[token]')
}
