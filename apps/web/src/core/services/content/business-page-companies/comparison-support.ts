import type { BusinessPageContent } from '@aprende-y-aplica/shared'

type ComparisonCategory =
  BusinessPageContent['companies']['comparison']['categories'][number]

export const supportComparison: ComparisonCategory = {
  name: 'Soporte y Servicios',
  features: [
    {
      name: 'Soporte por email',
      description: 'Tiempo de respuesta 24-48 horas',
      team: true,
      business: true,
      enterprise: true,
    },
    {
      name: 'Soporte prioritario',
      description: 'Respuesta rÃƒÂ¡pida garantizada',
      team: false,
      business: true,
      enterprise: true,
    },
    {
      name: 'Soporte 24/7 dedicado',
      description: 'Equipo dedicado disponible siempre',
      team: false,
      business: false,
      enterprise: true,
    },
    {
      name: 'Customer Success Manager',
      description: 'Gerente de cuenta asignado',
      team: false,
      business: false,
      enterprise: true,
    },
    {
      name: 'Onboarding personalizado',
      description: 'CapacitaciÃƒÂ³n a medida para tu equipo',
      team: false,
      business: false,
      enterprise: true,
    },
    {
      name: 'ConsultorÃƒÂ­a estratÃƒÂ©gica',
      description: 'AsesorÃƒÂ­a en estrategia de aprendizaje',
      team: false,
      business: false,
      enterprise: true,
    },
  ],
}
