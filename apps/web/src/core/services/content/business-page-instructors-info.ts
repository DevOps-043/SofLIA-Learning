import type { BusinessPageContent } from '@aprende-y-aplica/shared'

export const businessPageInstructorsInfo: BusinessPageContent['instructorsInfo'] =
  {
    title: 'Para Instructores',
    subtitle: 'Monetiza tu conocimiento y crea contenido de impacto',
    cards: [
      {
        id: 'monetization',
        icon: 'DollarSign',
        title: 'MonetizaciÃ³n',
        description:
          'Genera ingresos vendiendo tus cursos y recibe pagos automÃ¡ticos por cada venta.',
      },
      {
        id: 'analytics-instructor',
        icon: 'BarChart',
        title: 'Analytics Profesionales',
        description:
          'Analiza el desempeÃ±o de tus cursos, audiencia y tasa de conversiÃ³n en tiempo real.',
      },
      {
        id: 'tools',
        icon: 'Wrench',
        title: 'Herramientas Creadas',
        description:
          'Editor de video, cuestionarios interactivos, certificados personalizados y mÃ¡s.',
      },
      {
        id: 'support-instructor',
        icon: 'GraduationCap',
        title: 'Programa de Soporte',
        description:
          'Recursos exclusivos, mentorÃ­as y comunidad de instructores para ayudarte a crecer.',
      },
    ],
    benefits: [
      'Ã¢Å“â€œ RetenciÃ³n alta: hasta 80% de comisiones',
      'Ã¢Å“â€œ Crea cursos ilimitados sin restricciones',
      'Ã¢Å“â€œ PromociÃ³n automÃ¡tica a nuestra audiencia',
      'Ã¢Å“â€œ Pagos seguros y puntuales cada mes',
      'Ã¢Å“â€œ Herramientas de marketing incluidas',
    ],
    process: {
      title: 'CÃ³mo Convertirte en Instructor',
      steps: [
        {
          id: 'step-1',
          title: 'Aplica',
          description:
            'Completa el formulario de aplicaciÃ³n y comparte tu experiencia profesional.',
        },
        {
          id: 'step-2',
          title: 'RevisiÃ³n',
          description:
            'Nuestro equipo revisa tu perfil y te contacta para una entrevista.',
        },
        {
          id: 'step-3',
          title: 'Onboarding',
          description:
            'Recibe capacitaciÃ³n sobre nuestras herramientas y mejores prÃ¡cticas.',
        },
        {
          id: 'step-4',
          title: 'Publica',
          description:
            'Crea tu primer curso y comienza a monetizar tu conocimiento.',
        },
      ],
    },
    testimonials: [
      {
        id: 'instructor-testimonial-1',
        quote:
          'Gracias a SofLIA Business he podido monetizar mi experiencia de 15 aÃ±os en Machine Learning. La plataforma es intuitiva y el soporte excepcional.',
        author: 'Dr. Laura MartÃ­nez',
        role: 'Instructor desde 2022',
      },
      {
        id: 'instructor-testimonial-2',
        quote:
          'Los analytics me ayudan a optimizar constantemente mis cursos. He visto un crecimiento del 200% en mis ingresos en solo 6 meses.',
        author: 'Ing. Carlos Herrera',
        role: 'Instructor desde 2023',
      },
      {
        id: 'instructor-testimonial-3',
        quote:
          'La comunidad de instructores y los recursos disponibles son invaluables. RecomendarÃ­a esta plataforma sin dudarlo.',
        author: 'MSc. Ana RodrÃ­guez',
        role: 'Instructor desde 2022',
      },
    ],
    faq: {
      title: 'Preguntas Frecuentes - Instructores',
      subtitle: 'Todo lo que necesitas saber para monetizar tu conocimiento',
      items: [
        {
          question: 'Â¿CÃ³mo funciona el sistema de comisiones?',
          answer:
            'Ofrecemos una de las tasas de comisiÃ³n mÃ¡s competitivas del mercado. Los instructores reciben hasta 80% de los ingresos por cada venta, dependiendo del volumen de cursos vendidos y la trayectoria en la plataforma.',
        },
        {
          question: 'Â¿CuÃ¡ndo y cÃ³mo recibo mis pagos?',
          answer:
            'Los pagos se realizan mensualmente entre los dÃ­as 1 y 5 de cada mes. Utilizamos Stripe para pagos seguros y puedes configurar tu cuenta bancaria o PayPal para recibir los fondos directamente.',
        },
        {
          question: 'Â¿QuÃ© herramientas me proporcionan para crear contenido?',
          answer:
            'Acceso completo a nuestro editor de video integrado, creador de cuestionarios interactivos, diseÃ±ador de certificados personalizados, herramientas de captura de pantalla, y mucho mÃ¡s. Todo incluido sin costos adicionales.',
        },
        {
          question: 'Â¿CÃ³mo me ayudan a promocionar mis cursos?',
          answer:
            'Nuestro equipo de marketing promociona activamente todos los cursos en nuestras redes sociales, newsletters y plataforma. TambiÃ©n ofrecemos recursos de marketing para que promociones tus cursos de forma efectiva.',
        },
        {
          question: 'Â¿Hay lÃ­mites en la cantidad de cursos que puedo crear?',
          answer:
            'No hay lÃ­mites. Puedes crear tantos cursos como desees sin restricciones. Nuestra plataforma estÃ¡ diseÃ±ada para escalar con tu crecimiento como instructor.',
        },
        {
          question: 'Â¿QuÃ© apoyo recibo como instructor?',
          answer:
            'Incluye acceso a nuestra comunidad privada de instructores, mentorÃ­as mensuales con expertos, recursos educativos avanzados, seminarios web exclusivos y soporte tÃ©cnico priorizado para todas tus necesidades.',
        },
      ],
    },
  }
