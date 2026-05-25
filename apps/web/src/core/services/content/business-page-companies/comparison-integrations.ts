import type { BusinessPageContent } from '@aprende-y-aplica/shared'

type ComparisonCategory =
  BusinessPageContent['companies']['comparison']['categories'][number]

export const integrationsComparison: ComparisonCategory = {
  name: 'Integraciones',
  features: [
    {
      name: 'Single Sign-On (SSO)',
      description: 'IntegraciÃƒÂ³n con tu proveedor de identidad',
      team: false,
      business: true,
      enterprise: true,
    },
    {
      name: 'Integraciones LMS',
      description: 'ConexiÃƒÂ³n con Learning Management Systems',
      team: false,
      business: false,
      enterprise: true,
    },
    {
      name: 'API de reportes',
      description: 'Accede a datos via API',
      team: false,
      business: false,
      enterprise: true,
    },
    {
      name: 'IntegraciÃƒÂ³n con Slack',
      description: 'Notificaciones y acceso desde Slack',
      team: false,
      business: true,
      enterprise: true,
    },
    {
      name: 'IntegraciÃƒÂ³n con Microsoft Teams',
      description: 'Acceso directo desde Teams',
      team: false,
      business: false,
      enterprise: true,
    },
    {
      name: 'Webhooks personalizados',
      description: 'Eventos en tiempo real',
      team: false,
      business: false,
      enterprise: true,
    },
  ],
}
