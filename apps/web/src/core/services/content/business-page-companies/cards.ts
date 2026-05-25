import type { BusinessPageContent } from '@aprende-y-aplica/shared'

type CompanyCard = BusinessPageContent['companies']['cards'][number]

export const companyCards: CompanyCard[] = [
  {
    id: 'team',
    icon: 'Users',
    title: 'GestiÃƒÂ³n de Equipos',
    description:
      'Administra usuarios, asigna cursos y establece objetivos de aprendizaje para todo tu equipo.',
  },
  {
    id: 'certifications',
    icon: 'Award',
    title: 'Certificaciones',
    description:
      'Emite certificados oficiales reconocidos para validar las habilidades de tu equipo.',
  },
  {
    id: 'roi',
    icon: 'TrendingUp',
    title: 'ROI Medible',
    description:
      'Reportes detallados que demuestran el impacto real de la capacitaciÃƒÂ³n en tus mÃƒÂ©tricas.',
  },
  {
    id: 'integration',
    icon: 'Link',
    title: 'Integraciones',
    description:
      'ConÃƒÂ©ctate con tu LMS existente, Slack, Microsoft Teams y mÃƒÂ¡s herramientas empresariales.',
  },
]
