import type { CertificateTemplate } from './types'

export const certificateTemplates: CertificateTemplate[] = [
  {
    id: 'default',
    name: 'Plantilla Clásica',
    description: 'Diseño profesional con bordes decorativos y elementos ornamentales elegantes',
    preview: {
      primaryColor: 'var(--color-legacy-1e3a8a)',
      secondaryColor: 'var(--color-legacy-60a5fa)',
      accentColor: 'var(--color-legacy-d4af37)',
      style: 'default',
    },
  },
]
