import type { BusinessPageContent } from '@aprende-y-aplica/shared'

type ComparisonCategory =
  BusinessPageContent['companies']['comparison']['categories'][number]

export const userExperienceComparison: ComparisonCategory = {
  name: 'Experiencia del Usuario',
  features: [
    {
      name: 'Acceso a catÃƒÂ¡logo completo',
      description: 'Todos los cursos disponibles',
      team: true,
      business: true,
      enterprise: true,
    },
    {
      name: 'Certificaciones ilimitadas',
      description: 'Sin lÃƒÂ­mite de certificaciones emitidas',
      team: false,
      business: true,
      enterprise: true,
    },
    {
      name: 'Certificados personalizados',
      description: 'DiseÃƒÂ±o de certificados propio',
      team: false,
      business: false,
      enterprise: true,
    },
    {
      name: 'AplicaciÃƒÂ³n mÃƒÂ³vil',
      description: 'Acceso desde dispositivos mÃƒÂ³viles',
      team: true,
      business: true,
      enterprise: true,
    },
    {
      name: 'Offline learning',
      description: 'Descarga cursos para ver offline',
      team: false,
      business: true,
      enterprise: true,
    },
    {
      name: 'Cursos en vivo',
      description: 'Webinars y sesiones en tiempo real',
      team: false,
      business: false,
      enterprise: true,
    },
  ],
}
