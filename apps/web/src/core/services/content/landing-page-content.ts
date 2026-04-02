import type { LandingPageContent } from '@aprende-y-aplica/shared'

export const landingPageContent: LandingPageContent = {
  hero: {
    tag: 'âž¤ SofLIA',
    title: 'SofLIA: Domina la IA que transformarÃ¡ tu',
    highlightWord: 'futuro',
    description:
      'ConviÃ©rtete en experto aplicado: fundamentos claros, herramientas que importan, y hÃ¡bitos de aprendizaje continuo para destacar en la era de la inteligencia artificial.',
    ctaText: 'Iniciar SesiÃ³n',
    benefits: [
      'Ã¢Å“â€œ Fundamentos de IA sin complicarte',
      'Ã¢Å“â€œ Herramientas que realmente importan',
      'Ã¢Å“â€œ Experiencia personalizada a tu perfil',
      'Ã¢Å“â€œ HÃ¡bitos de aprendizaje continuo',
    ],
  },
  features: {
    title: 'Â¿Por quÃ© elegir nuestra plataforma?',
    subtitle: 'Descubre las ventajas que te harÃ¡n destacar en el mundo de la IA',
    cards: [
      {
        id: 'fundamentos',
        icon: 'BookOpen',
        title: 'Fundamentos SÃ³lidos',
        description:
          'Aprende los conceptos esenciales de IA sin perderte en teorÃ­a innecesaria.',
      },
      {
        id: 'herramientas',
        icon: 'Settings',
        title: 'Herramientas PrÃ¡cticas',
        description:
          'Utiliza las herramientas que realmente importan en el mercado laboral.',
      },
      {
        id: 'personalizada',
        icon: 'User',
        title: 'Experiencia Personalizada',
        description:
          'La plataforma adapta el contenido y el ritmo de aprendizaje segÃºn tu perfil profesional y objetivos.',
      },
      {
        id: 'crecimiento',
        icon: 'TrendingUp',
        title: 'Crecimiento Continuo',
        description:
          'Desarrolla hÃ¡bitos de aprendizaje que te mantendrÃ¡n actualizado.',
      },
    ],
  },
  statistics: [
    { value: '1000', label: 'Estudiantes Activos' },
    { value: '50', label: 'Cursos en la Plataforma' },
    { value: '95', label: '% de SatisfacciÃ³n' },
    { value: '24', label: 'Horas de Contenido' },
  ],
  testimonials: {
    title: 'Lo que dicen nuestros estudiantes',
    items: [
      {
        id: 'testimonial-1',
        quote:
          'Esta plataforma transformÃ³ mi carrera. Los proyectos prÃ¡cticos me dieron la confianza para aplicar IA en mi trabajo.',
        author: 'Ana GarcÃ­a',
        role: 'Data Scientist',
      },
      {
        id: 'testimonial-2',
        quote:
          'Excelente balance entre teorÃ­a y prÃ¡ctica. LogrÃ© implementar mis primeros modelos de ML en solo 3 meses.',
        author: 'Carlos Mendoza',
        role: 'Machine Learning Engineer',
      },
      {
        id: 'testimonial-3',
        quote:
          'El enfoque aplicado y los proyectos reales hicieron que el aprendizaje fuera mucho mÃ¡s efectivo.',
        author: 'MarÃ­a RodrÃ­guez',
        role: 'AI Consultant',
      },
    ],
  },
  cta: {
    title: 'Â¿Listo para transformar tu futuro?',
    subtitle: 'Ãšnete a miles de estudiantes que ya estÃ¡n dominando la IA',
    buttonText: 'Comenzar Ahora',
  },
}
