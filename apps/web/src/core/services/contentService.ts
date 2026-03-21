import { LandingPageContent, BusinessPageContent } from '@aprende-y-aplica/shared';

// Mock data - En el futuro esto vendrá de una API
const mockLandingPageContent: LandingPageContent = {
  hero: {
    tag: "➤ SofLIA",
    title: "SofLIA: Domina la IA que transformará tu",
    highlightWord: "futuro",
    description: "Conviértete en experto aplicado: fundamentos claros, herramientas que importan, y hábitos de aprendizaje continuo para destacar en la era de la inteligencia artificial.",
    ctaText: "Iniciar Sesión",
    benefits: [
      "âœ“ Fundamentos de IA sin complicarte",
      "âœ“ Herramientas que realmente importan",
      "âœ“ Experiencia personalizada a tu perfil",
      "âœ“ Hábitos de aprendizaje continuo"
    ]
  },
  features: {
    title: "¿Por qué elegir nuestra plataforma?",
    subtitle: "Descubre las ventajas que te harán destacar en el mundo de la IA",
    cards: [
      {
        id: "fundamentos",
        icon: "BookOpen",
        title: "Fundamentos Sólidos",
        description: "Aprende los conceptos esenciales de IA sin perderte en teoría innecesaria."
      },
      {
        id: "herramientas",
        icon: "Settings",
        title: "Herramientas Prácticas",
        description: "Utiliza las herramientas que realmente importan en el mercado laboral."
      },
      {
        id: "personalizada",
        icon: "User",
        title: "Experiencia Personalizada",
        description: "La plataforma adapta el contenido y el ritmo de aprendizaje según tu perfil profesional y objetivos."
      },
      {
        id: "crecimiento",
        icon: "TrendingUp",
        title: "Crecimiento Continuo",
        description: "Desarrolla hábitos de aprendizaje que te mantendrán actualizado."
      }
    ]
  },
  statistics: [
    { value: "1000", label: "Estudiantes Activos" },
    { value: "50", label: "Cursos en la Plataforma" },
    { value: "95", label: "% de Satisfacción" },
    { value: "24", label: "Horas de Contenido" }
  ],
  testimonials: {
    title: "Lo que dicen nuestros estudiantes",
    items: [
      {
        id: "testimonial-1",
        quote: "Esta plataforma transformó mi carrera. Los proyectos prácticos me dieron la confianza para aplicar IA en mi trabajo.",
        author: "Ana García",
        role: "Data Scientist"
      },
      {
        id: "testimonial-2",
        quote: "Excelente balance entre teoría y práctica. Logré implementar mis primeros modelos de ML en solo 3 meses.",
        author: "Carlos Mendoza",
        role: "Machine Learning Engineer"
      },
      {
        id: "testimonial-3",
        quote: "El enfoque aplicado y los proyectos reales hicieron que el aprendizaje fuera mucho más efectivo.",
        author: "María Rodríguez",
        role: "AI Consultant"
      }
    ]
  },
  cta: {
    title: "¿Listo para transformar tu futuro?",
    subtitle: "Únete a miles de estudiantes que ya están dominando la IA",
    buttonText: "Comenzar Ahora"
  }
};

// Mock data para Business Page
const mockBusinessPageContent: BusinessPageContent = {
  hero: {
    tag: "🚀 SofLIA Business",
    title: "Soluciones IA para",
    highlightWord: "tu organización",
    description: "Ya seas una empresa buscando capacitar a tu equipo o un instructor profesional, tenemos la plataforma perfecta para ti.",
    ctaText: "Contactar Ventas",
    benefits: [
      "âœ“ Soluciones personalizadas para empresas",
      "âœ“ Herramientas profesionales para instructores",
      "âœ“ Analytics y reportes detallados",
      "âœ“ Soporte dedicado"
    ]
  },
  benefits: {
    title: "Todo lo que necesitas",
    subtitle: "Funcionalidades diseñadas para empresas e instructores profesionales",
    cards: [
      {
        id: "admin",
        icon: "Shield",
        title: "Panel de Administración",
        description: "Gestiona usuarios, asigna cursos y monitorea el progreso desde un solo lugar."
      },
      {
        id: "analytics",
        icon: "BarChart",
        title: "Analytics Avanzados",
        description: "Reportes detallados sobre desempeño, certificaciones y ROI."
      },
      {
        id: "custom",
        icon: "Settings",
        title: "Personalización",
        description: "Contenido personalizado e integraciones según tus necesidades."
      },
      {
        id: "support",
        icon: "Headphones",
        title: "Soporte 24/7",
        description: "Asistencia prioritaria y consultoría especializada."
      }
    ]
  },
  instructors: {
    title: "Instructores Expertos",
    subtitle: "Aprende de los mejores profesionales de IA en el mercado",
    items: [
      {
        id: "instructor-1",
        name: "Dr. Laura Martínez",
        role: "AI Research Lead",
        bio: "PhD en Machine Learning con 15 años de experiencia. Ha liderado proyectos de IA para Fortune 500.",
        rating: 4.9,
        students: 15000,
        courses: 8,
        expertise: ["Machine Learning", "Deep Learning", "NLP"]
      },
      {
        id: "instructor-2",
        name: "Ing. Carlos Herrera",
        role: "Data Science Director",
        bio: "Experto en implementación de IA en empresas. Consultor para startups unicornio en Latam.",
        rating: 4.8,
        students: 12000,
        courses: 6,
        expertise: ["Data Science", "Computer Vision", "MLOps"]
      },
      {
        id: "instructor-3",
        name: "MSc. Ana Rodríguez",
        role: "AI Strategy Advisor",
        bio: "Especialista en transformación digital con IA. Ha capacitado a más de 500 ejecutivos.",
        rating: 4.9,
        students: 8500,
        courses: 5,
        expertise: ["Business AI", "Strategy", "Ethics"]
      }
    ]
  },
  companies: {
    title: "Para Empresas",
    subtitle: "Capacitación IA escalable para toda tu organización",
    cards: [
      {
        id: "team",
        icon: "Users",
        title: "Gestión de Equipos",
        description: "Administra usuarios, asigna cursos y establece objetivos de aprendizaje para todo tu equipo."
      },
      {
        id: "certifications",
        icon: "Award",
        title: "Certificaciones",
        description: "Emite certificados oficiales reconocidos para validar las habilidades de tu equipo."
      },
      {
        id: "roi",
        icon: "TrendingUp",
        title: "ROI Medible",
        description: "Reportes detallados que demuestran el impacto real de la capacitación en tus métricas."
      },
      {
        id: "integration",
        icon: "Link",
        title: "Integraciones",
        description: "Conéctate con tu LMS existente, Slack, Microsoft Teams y más herramientas empresariales."
      }
    ],
    pricing: {
      title: "Planes para Empresas",
      subtitle: "Elige el plan que mejor se adapte al tamaño de tu organización",
      tiers: [
        {
          id: "team",
          name: "Team",
          description: "Perfecto para equipos pequeños",
          price: "$99",
          period: "mes",
          features: [
            "Hasta 10 usuarios",
            "Acceso a todos los cursos",
            "Certificaciones incluidas",
            "Reportes básicos",
            "Soporte por email"
          ],
          isPopular: false,
          ctaText: "Contratar Plan"
        },
        {
          id: "business",
          name: "Business",
          description: "Ideal para empresas en crecimiento",
          price: "$399",
          period: "mes",
          features: [
            "Hasta 50 usuarios",
            "Acceso a todos los cursos",
            "Certificaciones ilimitadas",
            "Analytics avanzados",
            "Panel de administración",
            "Soporte prioritario",
            "Contenido personalizado"
          ],
          isPopular: true,
          ctaText: "Empezar Ahora"
        },
        {
          id: "enterprise",
          name: "Enterprise",
          description: "Soluciones a medida para grandes organizaciones",
          price: "Personalizado",
          period: "",
          features: [
            "Usuarios ilimitados",
            "Acceso a todos los cursos",
            "Certificaciones ilimitadas",
            "Analytics empresariales",
            "Panel administración avanzado",
            "Soporte 24/7 dedicado",
            "Contenido 100% personalizado",
            "Integración con LMS",
            "Consultoría estratégica",
            "Branding corporativo"
          ],
          isPopular: false,
          ctaText: "Contactar Ventas"
        }
      ]
    },
    comparison: {
      title: "Comparación de Características",
      subtitle: "Elige el plan que mejor se adapte a tus necesidades",
      categories: [
        {
          name: "Administración y Gestión",
          features: [
            {
              name: "Panel de administración",
              description: "Gestiona usuarios y asignaciones de cursos",
              team: true,
              business: true,
              enterprise: true
            },
            {
              name: "Asignación de cursos con mensajería",
              description: "Personaliza mensajes al asignar cursos",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Grupos de usuarios personalizados",
              description: "Organiza tu equipo por departamentos o roles",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Administración avanzada de grupos",
              description: "Control granular por grupo",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Branding corporativo",
              description: "Personaliza la plataforma con tu logo y colores",
              team: false,
              business: false,
              enterprise: true
            }
          ]
        },
        {
          name: "Análisis e Informes",
          features: [
            {
              name: "Reportes básicos",
              description: "Estadísticas de progreso y completación",
              team: true,
              business: true,
              enterprise: true
            },
            {
              name: "Analytics avanzados",
              description: "Análisis profundo de aprendizaje",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Información de habilidades",
              description: "Skills insights y gaps de conocimiento",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Análisis de cursos",
              description: "Performance y engagement por curso",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Dashboard personalizado",
              description: "Dashboards a medida por necesidad",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Exportación de datos",
              description: "Exporta reportes en múltiples formatos",
              team: false,
              business: false,
              enterprise: true
            }
          ]
        },
        {
          name: "Experiencia del Usuario",
          features: [
            {
              name: "Acceso a catálogo completo",
              description: "Todos los cursos disponibles",
              team: true,
              business: true,
              enterprise: true
            },
            {
              name: "Certificaciones ilimitadas",
              description: "Sin límite de certificaciones emitidas",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Certificados personalizados",
              description: "Diseño de certificados propio",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Aplicación móvil",
              description: "Acceso desde dispositivos móviles",
              team: true,
              business: true,
              enterprise: true
            },
            {
              name: "Offline learning",
              description: "Descarga cursos para ver offline",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Cursos en vivo",
              description: "Webinars y sesiones en tiempo real",
              team: false,
              business: false,
              enterprise: true
            }
          ]
        },
        {
          name: "Integraciones",
          features: [
            {
              name: "Single Sign-On (SSO)",
              description: "Integración con tu proveedor de identidad",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Integraciones LMS",
              description: "Conexión con Learning Management Systems",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "API de reportes",
              description: "Accede a datos via API",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Integración con Slack",
              description: "Notificaciones y acceso desde Slack",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Integración con Microsoft Teams",
              description: "Acceso directo desde Teams",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Webhooks personalizados",
              description: "Eventos en tiempo real",
              team: false,
              business: false,
              enterprise: true
            }
          ]
        },
        {
          name: "Soporte y Servicios",
          features: [
            {
              name: "Soporte por email",
              description: "Tiempo de respuesta 24-48 horas",
              team: true,
              business: true,
              enterprise: true
            },
            {
              name: "Soporte prioritario",
              description: "Respuesta rápida garantizada",
              team: false,
              business: true,
              enterprise: true
            },
            {
              name: "Soporte 24/7 dedicado",
              description: "Equipo dedicado disponible siempre",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Customer Success Manager",
              description: "Gerente de cuenta asignado",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Onboarding personalizado",
              description: "Capacitación a medida para tu equipo",
              team: false,
              business: false,
              enterprise: true
            },
            {
              name: "Consultoría estratégica",
              description: "Asesoría en estrategia de aprendizaje",
              team: false,
              business: false,
              enterprise: true
            }
          ]
        }
      ]
    },
    testimonials: [
      {
        id: "company-testimonial-1",
        quote: "Implementar SofLIA Business ha sido una de las mejores decisiones. Nuestro equipo ahora domina las herramientas de IA más relevantes.",
        author: "Roberto Silva",
        role: "CTO, TechSolutions Inc."
      },
      {
        id: "company-testimonial-2",
        quote: "Los reportes detallados nos permiten medir el ROI real de la capacitación. Hemos visto un aumento del 40% en productividad.",
        author: "Patricia López",
        role: "CHRO, Innovation Group"
      },
      {
        id: "company-testimonial-3",
        quote: "El soporte dedicado y la personalización del contenido superaron nuestras expectativas. Altamente recomendado.",
        author: "Miguel Torres",
        role: "CEO, Digital Transform Co."
      }
    ],
    faq: {
      title: "Preguntas Frecuentes - Empresas",
      subtitle: "Todo lo que necesitas saber sobre SofLIA Business",
      items: [
        {
          question: "¿Cómo funciona la facturación?",
          answer: "Ofrecemos planes mensuales y anuales. Los planes anuales incluyen un descuento del 20%. La facturación es automática y puedes cambiar o cancelar tu plan en cualquier momento desde tu panel de administración."
        },
        {
          question: "¿Puedo agregar o eliminar usuarios durante el ciclo?",
          answer: "Sí, puedes escalar tu equipo según tus necesidades. Los usuarios adicionales se facturan de forma prorrateada, y puedes eliminar usuarios en cualquier momento sin penalizaciones."
        },
        {
          question: "¿Cómo funciona la integración con nuestro LMS actual?",
          answer: "Ofrecemos integraciones nativas con los principales LMS del mercado, incluyendo SCORM, xAPI y LTI. Nuestro equipo de Customer Success te ayudará a configurar la integración durante el onboarding."
        },
        {
          question: "¿Qué incluye el soporte?",
          answer: "El soporte varía según tu plan. Team incluye soporte por email, Business incluye soporte prioritario con garantía de respuesta en 4 horas, y Enterprise incluye soporte 24/7 dedicado con un Customer Success Manager asignado."
        },
        {
          question: "¿Puedo probar la plataforma antes de comprar?",
          answer: "¡Absolutamente! Ofrecemos una prueba gratuita de 14 días para todos los planes. No requiere tarjeta de crédito y tendrás acceso completo a todas las funcionalidades del plan que elijas."
        },
        {
          question: "¿Los certificados son reconocidos?",
          answer: "Sí, nuestros certificados son oficiales y verificables digitalmente. Incluyen códigos QR para validación en línea y están diseñados para ser compartidos en LinkedIn y otros perfiles profesionales."
        }
      ]
    }
  },
  instructorsInfo: {
    title: "Para Instructores",
    subtitle: "Monetiza tu conocimiento y crea contenido de impacto",
    cards: [
      {
        id: "monetization",
        icon: "DollarSign",
        title: "Monetización",
        description: "Genera ingresos vendiendo tus cursos y recibe pagos automáticos por cada venta."
      },
      {
        id: "analytics-instructor",
        icon: "BarChart",
        title: "Analytics Profesionales",
        description: "Analiza el desempeño de tus cursos, audiencia y tasa de conversión en tiempo real."
      },
      {
        id: "tools",
        icon: "Wrench",
        title: "Herramientas Creadas",
        description: "Editor de video, cuestionarios interactivos, certificados personalizados y más."
      },
      {
        id: "support-instructor",
        icon: "GraduationCap",
        title: "Programa de Soporte",
        description: "Recursos exclusivos, mentorías y comunidad de instructores para ayudarte a crecer."
      }
    ],
    benefits: [
      "âœ“ Retención alta: hasta 80% de comisiones",
      "âœ“ Crea cursos ilimitados sin restricciones",
      "âœ“ Promoción automática a nuestra audiencia",
      "âœ“ Pagos seguros y puntuales cada mes",
      "âœ“ Herramientas de marketing incluidas"
    ],
    process: {
      title: "Cómo Convertirte en Instructor",
      steps: [
        {
          id: "step-1",
          title: "Aplica",
          description: "Completa el formulario de aplicación y comparte tu experiencia profesional."
        },
        {
          id: "step-2",
          title: "Revisión",
          description: "Nuestro equipo revisa tu perfil y te contacta para una entrevista."
        },
        {
          id: "step-3",
          title: "Onboarding",
          description: "Recibe capacitación sobre nuestras herramientas y mejores prácticas."
        },
        {
          id: "step-4",
          title: "Publica",
          description: "Crea tu primer curso y comienza a monetizar tu conocimiento."
        }
      ]
    },
    testimonials: [
      {
        id: "instructor-testimonial-1",
        quote: "Gracias a SofLIA Business he podido monetizar mi experiencia de 15 años en Machine Learning. La plataforma es intuitiva y el soporte excepcional.",
        author: "Dr. Laura Martínez",
        role: "Instructor desde 2022"
      },
      {
        id: "instructor-testimonial-2",
        quote: "Los analytics me ayudan a optimizar constantemente mis cursos. He visto un crecimiento del 200% en mis ingresos en solo 6 meses.",
        author: "Ing. Carlos Herrera",
        role: "Instructor desde 2023"
      },
      {
        id: "instructor-testimonial-3",
        quote: "La comunidad de instructores y los recursos disponibles son invaluables. Recomendaría esta plataforma sin dudarlo.",
        author: "MSc. Ana Rodríguez",
        role: "Instructor desde 2022"
      }
    ],
    faq: {
      title: "Preguntas Frecuentes - Instructores",
      subtitle: "Todo lo que necesitas saber para monetizar tu conocimiento",
      items: [
        {
          question: "¿Cómo funciona el sistema de comisiones?",
          answer: "Ofrecemos una de las tasas de comisión más competitivas del mercado. Los instructores reciben hasta 80% de los ingresos por cada venta, dependiendo del volumen de cursos vendidos y la trayectoria en la plataforma."
        },
        {
          question: "¿Cuándo y cómo recibo mis pagos?",
          answer: "Los pagos se realizan mensualmente entre los días 1 y 5 de cada mes. Utilizamos Stripe para pagos seguros y puedes configurar tu cuenta bancaria o PayPal para recibir los fondos directamente."
        },
        {
          question: "¿Qué herramientas me proporcionan para crear contenido?",
          answer: "Acceso completo a nuestro editor de video integrado, creador de cuestionarios interactivos, diseñador de certificados personalizados, herramientas de captura de pantalla, y mucho más. Todo incluido sin costos adicionales."
        },
        {
          question: "¿Cómo me ayudan a promocionar mis cursos?",
          answer: "Nuestro equipo de marketing promociona activamente todos los cursos en nuestras redes sociales, newsletters y plataforma. También ofrecemos recursos de marketing para que promociones tus cursos de forma efectiva."
        },
        {
          question: "¿Hay límites en la cantidad de cursos que puedo crear?",
          answer: "No hay límites. Puedes crear tantos cursos como desees sin restricciones. Nuestra plataforma está diseñada para escalar con tu crecimiento como instructor."
        },
        {
          question: "¿Qué apoyo recibo como instructor?",
          answer: "Incluye acceso a nuestra comunidad privada de instructores, mentorías mensuales con expertos, recursos educativos avanzados, seminarios web exclusivos y soporte técnico priorizado para todas tus necesidades."
        }
      ]
    }
  },
  cta: {
    title: "¿Listo para comenzar?",
    subtitle: "Únete a cientos de empresas e instructores que confían en nosotros",
    buttonText: "Contactar Ventas"
  }
};

export class ContentService {
  /**
   * Obtiene el contenido de la landing page
   * En el futuro esto hará una llamada a la API
   */
  static async fetchLandingPageContent(): Promise<LandingPageContent> {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // TODO: Reemplazar con llamada real a la API
      // const response = await fetch('/api/content/landing-page');
      // if (!response.ok) {
      //   throw new Error('Failed to fetch landing page content');
      // }
      // return await response.json();
      
      return mockLandingPageContent;
    } catch (error) {
      // console.error('Error fetching landing page content:', error);
      // Retornar contenido mock como fallback
      return mockLandingPageContent;
    }
  }
  
  /**
   * Obtiene el contenido de la landing page con manejo de estados
   */
  static async getLandingPageContent() {
    try {
      return {
        data: await this.fetchLandingPageContent(),
        loading: false,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene el contenido de la página business
   */
  static async fetchBusinessPageContent(): Promise<BusinessPageContent> {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // TODO: Reemplazar con llamada real a la API
      return mockBusinessPageContent;
    } catch (error) {
      // console.error('Error fetching business page content:', error);
      return mockBusinessPageContent;
    }
  }

  /**
   * Obtiene el contenido de la página business con manejo de estados
   */
  static async getBusinessPageContent() {
    try {
      return {
        data: await this.fetchBusinessPageContent(),
        loading: false,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

