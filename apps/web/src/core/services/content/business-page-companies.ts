import type { BusinessPageContent } from '@aprende-y-aplica/shared'

export const businessPageCompanies: BusinessPageContent['companies'] = {
  title: 'Para Empresas',
  subtitle: 'CapacitaciÃ³n IA escalable para toda tu organizaciÃ³n',
  cards: [
    {
      id: 'team',
      icon: 'Users',
      title: 'GestiÃ³n de Equipos',
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
        'Reportes detallados que demuestran el impacto real de la capacitaciÃ³n en tus mÃ©tricas.',
    },
    {
      id: 'integration',
      icon: 'Link',
      title: 'Integraciones',
      description:
        'ConÃ©ctate con tu LMS existente, Slack, Microsoft Teams y mÃ¡s herramientas empresariales.',
    },
  ],
  pricing: {
    title: 'Planes para Empresas',
    subtitle: 'Elige el plan que mejor se adapte al tamaÃ±o de tu organizaciÃ³n',
    tiers: [
      {
        id: 'team',
        name: 'Team',
        description: 'Perfecto para equipos pequeÃ±os',
        price: '$99',
        period: 'mes',
        features: [
          'Hasta 10 usuarios',
          'Acceso a todos los cursos',
          'Certificaciones incluidas',
          'Reportes bÃ¡sicos',
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
          'Panel de administraciÃ³n',
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
          'Panel administraciÃ³n avanzado',
          'Soporte 24/7 dedicado',
          'Contenido 100% personalizado',
          'IntegraciÃ³n con LMS',
          'ConsultorÃ­a estratÃ©gica',
          'Branding corporativo',
        ],
        isPopular: false,
        ctaText: 'Contactar Ventas',
      },
    ],
  },
  comparison: {
    title: 'ComparaciÃ³n de CaracterÃ­sticas',
    subtitle: 'Elige el plan que mejor se adapte a tus necesidades',
    categories: [
      {
        name: 'AdministraciÃ³n y GestiÃ³n',
        features: [
          {
            name: 'Panel de administraciÃ³n',
            description: 'Gestiona usuarios y asignaciones de cursos',
            team: true,
            business: true,
            enterprise: true,
          },
          {
            name: 'AsignaciÃ³n de cursos con mensajerÃ­a',
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
            name: 'AdministraciÃ³n avanzada de grupos',
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
      },
      {
        name: 'AnÃ¡lisis e Informes',
        features: [
          {
            name: 'Reportes bÃ¡sicos',
            description: 'EstadÃ­sticas de progreso y completaciÃ³n',
            team: true,
            business: true,
            enterprise: true,
          },
          {
            name: 'Analytics avanzados',
            description: 'AnÃ¡lisis profundo de aprendizaje',
            team: false,
            business: true,
            enterprise: true,
          },
          {
            name: 'InformaciÃ³n de habilidades',
            description: 'Skills insights y gaps de conocimiento',
            team: false,
            business: true,
            enterprise: true,
          },
          {
            name: 'AnÃ¡lisis de cursos',
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
            name: 'ExportaciÃ³n de datos',
            description: 'Exporta reportes en mÃºltiples formatos',
            team: false,
            business: false,
            enterprise: true,
          },
        ],
      },
      {
        name: 'Experiencia del Usuario',
        features: [
          {
            name: 'Acceso a catÃ¡logo completo',
            description: 'Todos los cursos disponibles',
            team: true,
            business: true,
            enterprise: true,
          },
          {
            name: 'Certificaciones ilimitadas',
            description: 'Sin lÃ­mite de certificaciones emitidas',
            team: false,
            business: true,
            enterprise: true,
          },
          {
            name: 'Certificados personalizados',
            description: 'DiseÃ±o de certificados propio',
            team: false,
            business: false,
            enterprise: true,
          },
          {
            name: 'AplicaciÃ³n mÃ³vil',
            description: 'Acceso desde dispositivos mÃ³viles',
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
      },
      {
        name: 'Integraciones',
        features: [
          {
            name: 'Single Sign-On (SSO)',
            description: 'IntegraciÃ³n con tu proveedor de identidad',
            team: false,
            business: true,
            enterprise: true,
          },
          {
            name: 'Integraciones LMS',
            description: 'ConexiÃ³n con Learning Management Systems',
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
            name: 'IntegraciÃ³n con Slack',
            description: 'Notificaciones y acceso desde Slack',
            team: false,
            business: true,
            enterprise: true,
          },
          {
            name: 'IntegraciÃ³n con Microsoft Teams',
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
      },
      {
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
            description: 'Respuesta rÃ¡pida garantizada',
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
            description: 'CapacitaciÃ³n a medida para tu equipo',
            team: false,
            business: false,
            enterprise: true,
          },
          {
            name: 'ConsultorÃ­a estratÃ©gica',
            description: 'AsesorÃ­a en estrategia de aprendizaje',
            team: false,
            business: false,
            enterprise: true,
          },
        ],
      },
    ],
  },
  testimonials: [
    {
      id: 'company-testimonial-1',
      quote:
        'Implementar SofLIA Business ha sido una de las mejores decisiones. Nuestro equipo ahora domina las herramientas de IA mÃ¡s relevantes.',
      author: 'Roberto Silva',
      role: 'CTO, TechSolutions Inc.',
    },
    {
      id: 'company-testimonial-2',
      quote:
        'Los reportes detallados nos permiten medir el ROI real de la capacitaciÃ³n. Hemos visto un aumento del 40% en productividad.',
      author: 'Patricia LÃ³pez',
      role: 'CHRO, Innovation Group',
    },
    {
      id: 'company-testimonial-3',
      quote:
        'El soporte dedicado y la personalizaciÃ³n del contenido superaron nuestras expectativas. Altamente recomendado.',
      author: 'Miguel Torres',
      role: 'CEO, Digital Transform Co.',
    },
  ],
  faq: {
    title: 'Preguntas Frecuentes - Empresas',
    subtitle: 'Todo lo que necesitas saber sobre SofLIA Business',
    items: [
      {
        question: 'Â¿CÃ³mo funciona la facturaciÃ³n?',
        answer:
          'Ofrecemos planes mensuales y anuales. Los planes anuales incluyen un descuento del 20%. La facturaciÃ³n es automÃ¡tica y puedes cambiar o cancelar tu plan en cualquier momento desde tu panel de administraciÃ³n.',
      },
      {
        question: 'Â¿Puedo agregar o eliminar usuarios durante el ciclo?',
        answer:
          'SÃ­, puedes escalar tu equipo segÃºn tus necesidades. Los usuarios adicionales se facturan de forma prorrateada, y puedes eliminar usuarios en cualquier momento sin penalizaciones.',
      },
      {
        question: 'Â¿CÃ³mo funciona la integraciÃ³n con nuestro LMS actual?',
        answer:
          'Ofrecemos integraciones nativas con los principales LMS del mercado, incluyendo SCORM, xAPI y LTI. Nuestro equipo de Customer Success te ayudarÃ¡ a configurar la integraciÃ³n durante el onboarding.',
      },
      {
        question: 'Â¿QuÃ© incluye el soporte?',
        answer:
          'El soporte varÃ­a segÃºn tu plan. Team incluye soporte por email, Business incluye soporte prioritario con garantÃ­a de respuesta en 4 horas, y Enterprise incluye soporte 24/7 dedicado con un Customer Success Manager asignado.',
      },
      {
        question: 'Â¿Puedo probar la plataforma antes de comprar?',
        answer:
          'Â¡Absolutamente! Ofrecemos una prueba gratuita de 14 dÃ­as para todos los planes. No requiere tarjeta de crÃ©dito y tendrÃ¡s acceso completo a todas las funcionalidades del plan que elijas.',
      },
      {
        question: 'Â¿Los certificados son reconocidos?',
        answer:
          'SÃ­, nuestros certificados son oficiales y verificables digitalmente. Incluyen cÃ³digos QR para validaciÃ³n en lÃ­nea y estÃ¡n diseÃ±ados para ser compartidos en LinkedIn y otros perfiles profesionales.',
      },
    ],
  },
}
