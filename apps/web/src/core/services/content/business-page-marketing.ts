import type { BusinessPageContent } from '@aprende-y-aplica/shared'

export const businessPageHero: BusinessPageContent['hero'] = {
  tag: 'ðŸš€ SofLIA Business',
  title: 'Soluciones IA para',
  highlightWord: 'tu organizaciÃ³n',
  description:
    'Ya seas una empresa buscando capacitar a tu equipo o un instructor profesional, tenemos la plataforma perfecta para ti.',
  ctaText: 'Contactar Ventas',
  benefits: [
    'Ã¢Å“â€œ Soluciones personalizadas para empresas',
    'Ã¢Å“â€œ Herramientas profesionales para instructores',
    'Ã¢Å“â€œ Analytics y reportes detallados',
    'Ã¢Å“â€œ Soporte dedicado',
  ],
}

export const businessPageBenefits: BusinessPageContent['benefits'] = {
  title: 'Todo lo que necesitas',
  subtitle:
    'Funcionalidades diseÃ±adas para empresas e instructores profesionales',
  cards: [
    {
      id: 'admin',
      icon: 'Shield',
      title: 'Panel de AdministraciÃ³n',
      description:
        'Gestiona usuarios, asigna cursos y monitorea el progreso desde un solo lugar.',
    },
    {
      id: 'analytics',
      icon: 'BarChart',
      title: 'Analytics Avanzados',
      description: 'Reportes detallados sobre desempeÃ±o, certificaciones y ROI.',
    },
    {
      id: 'custom',
      icon: 'Settings',
      title: 'PersonalizaciÃ³n',
      description: 'Contenido personalizado e integraciones segÃºn tus necesidades.',
    },
    {
      id: 'support',
      icon: 'Headphones',
      title: 'Soporte 24/7',
      description: 'Asistencia prioritaria y consultorÃ­a especializada.',
    },
  ],
}

export const businessPageInstructors: BusinessPageContent['instructors'] = {
  title: 'Instructores Expertos',
  subtitle: 'Aprende de los mejores profesionales de IA en el mercado',
  items: [
    {
      id: 'instructor-1',
      name: 'Dr. Laura MartÃ­nez',
      role: 'AI Research Lead',
      bio: 'PhD en Machine Learning con 15 aÃ±os de experiencia. Ha liderado proyectos de IA para Fortune 500.',
      rating: 4.9,
      students: 15000,
      courses: 8,
      expertise: ['Machine Learning', 'Deep Learning', 'NLP'],
    },
    {
      id: 'instructor-2',
      name: 'Ing. Carlos Herrera',
      role: 'Data Science Director',
      bio: 'Experto en implementaciÃ³n de IA en empresas. Consultor para startups unicornio en Latam.',
      rating: 4.8,
      students: 12000,
      courses: 6,
      expertise: ['Data Science', 'Computer Vision', 'MLOps'],
    },
    {
      id: 'instructor-3',
      name: 'MSc. Ana RodrÃ­guez',
      role: 'AI Strategy Advisor',
      bio: 'Especialista en transformaciÃ³n digital con IA. Ha capacitado a mÃ¡s de 500 ejecutivos.',
      rating: 4.9,
      students: 8500,
      courses: 5,
      expertise: ['Business AI', 'Strategy', 'Ethics'],
    },
  ],
}

export const businessPageCta: BusinessPageContent['cta'] = {
  title: 'Â¿Listo para comenzar?',
  subtitle: 'Ãšnete a cientos de empresas e instructores que confÃ­an en nosotros',
  buttonText: 'Contactar Ventas',
}
