import type { BusinessPageContent } from '@aprende-y-aplica/shared'

type CompanyPricing = BusinessPageContent['companies']['pricing']

export const companyPricing: CompanyPricing = {
  title: 'Planes para Empresas',
  subtitle: 'Elige el plan que mejor se adapte al tamaÃƒÂ±o de tu organizaciÃƒÂ³n',
  tiers: [
    {
      id: 'team',
      name: 'Team',
      description: 'Perfecto para equipos pequeÃƒÂ±os',
      price: '$99',
      period: 'mes',
      features: [
        'Hasta 10 usuarios',
        'Acceso a todos los cursos',
        'Certificaciones incluidas',
        'Reportes bÃƒÂ¡sicos',
        'Soporte por email',
      ],
      isPopular: false,
      ctaText: 'Contratar Plan',
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Ideal para empresas en crecimiento',
      price: '$399',
      period: 'mes',
      features: [
        'Hasta 50 usuarios',
        'Acceso a todos los cursos',
        'Certificaciones ilimitadas',
        'Analytics avanzados',
        'Panel de administraciÃƒÂ³n',
        'Soporte prioritario',
        'Contenido personalizado',
      ],
      isPopular: true,
      ctaText: 'Empezar Ahora',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Soluciones a medida para grandes organizaciones',
      price: 'Personalizado',
      period: '',
      features: [
        'Usuarios ilimitados',
        'Acceso a todos los cursos',
        'Certificaciones ilimitadas',
        'Analytics empresariales',
        'Panel administraciÃƒÂ³n avanzado',
        'Soporte 24/7 dedicado',
        'Contenido 100% personalizado',
        'IntegraciÃƒÂ³n con LMS',
        'ConsultorÃƒÂ­a estratÃƒÂ©gica',
        'Branding corporativo',
      ],
      isPopular: false,
      ctaText: 'Contactar Ventas',
    },
  ],
}
