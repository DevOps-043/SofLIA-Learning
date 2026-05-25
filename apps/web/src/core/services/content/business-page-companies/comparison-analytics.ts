import type { BusinessPageContent } from '@aprende-y-aplica/shared'

type ComparisonCategory =
  BusinessPageContent['companies']['comparison']['categories'][number]

export const analyticsComparison: ComparisonCategory = {
  name: 'AnÃƒÂ¡lisis e Informes',
  features: [
    {
      name: 'Reportes bÃƒÂ¡sicos',
      description: 'EstadÃƒÂ­sticas de progreso y completaciÃƒÂ³n',
      team: true,
      business: true,
      enterprise: true,
    },
    {
      name: 'Analytics avanzados',
      description: 'AnÃƒÂ¡lisis profundo de aprendizaje',
      team: false,
      business: true,
      enterprise: true,
    },
    {
      name: 'InformaciÃƒÂ³n de habilidades',
      description: 'Skills insights y gaps de conocimiento',
      team: false,
      business: true,
      enterprise: true,
    },
    {
      name: 'AnÃƒÂ¡lisis de cursos',
      description: 'Performance y engagement por curso',
      team: false,
      business: true,
      enterprise: true,
    },
    {
      name: 'Dashboard personalizado',
      description: 'Dashboards a medida por necesidad',
      team: false,
      business: false,
      enterprise: true,
    },
    {
      name: 'ExportaciÃƒÂ³n de datos',
      description: 'Exporta reportes en mÃƒÂºltiples formatos',
      team: false,
      business: false,
      enterprise: true,
    },
  ],
}
