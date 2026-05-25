import type { BusinessPageContent } from '@aprende-y-aplica/shared'

type ComparisonCategory =
  BusinessPageContent['companies']['comparison']['categories'][number]

export const administrationComparison: ComparisonCategory = {
  name: 'AdministraciÃƒÂ³n y GestiÃƒÂ³n',
  features: [
    {
      name: 'Panel de administraciÃƒÂ³n',
      description: 'Gestiona usuarios y asignaciones de cursos',
      team: true,
      business: true,
      enterprise: true,
    },
    {
      name: 'AsignaciÃƒÂ³n de cursos con mensajerÃƒÂ­a',
      description: 'Personaliza mensajes al asignar cursos',
      team: false,
      business: true,
      enterprise: true,
    },
    {
      name: 'Grupos de usuarios personalizados',
      description: 'Organiza tu equipo por departamentos o roles',
      team: false,
      business: true,
      enterprise: true,
    },
    {
      name: 'AdministraciÃƒÂ³n avanzada de grupos',
      description: 'Control granular por grupo',
      team: false,
      business: false,
      enterprise: true,
    },
    {
      name: 'Branding corporativo',
      description: 'Personaliza la plataforma con tu logo y colores',
      team: false,
      business: false,
      enterprise: true,
    },
  ],
}
