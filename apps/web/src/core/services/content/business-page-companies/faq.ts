import type { BusinessPageContent } from '@aprende-y-aplica/shared'

type CompanyFaq = BusinessPageContent['companies']['faq']

export const companyFaq: CompanyFaq = {
  title: 'Preguntas Frecuentes - Empresas',
  subtitle: 'Todo lo que necesitas saber sobre SofLIA Business',
  items: [
    {
      question: 'Ã‚Â¿CÃƒÂ³mo funciona la facturaciÃƒÂ³n?',
      answer:
        'Ofrecemos planes mensuales y anuales. Los planes anuales incluyen un descuento del 20%. La facturaciÃƒÂ³n es automÃƒÂ¡tica y puedes cambiar o cancelar tu plan en cualquier momento desde tu panel de administraciÃƒÂ³n.',
    },
    {
      question: 'Ã‚Â¿Puedo agregar o eliminar usuarios durante el ciclo?',
      answer:
        'SÃƒÂ­, puedes escalar tu equipo segÃƒÂºn tus necesidades. Los usuarios adicionales se facturan de forma prorrateada, y puedes eliminar usuarios en cualquier momento sin penalizaciones.',
    },
    {
      question: 'Ã‚Â¿CÃƒÂ³mo funciona la integraciÃƒÂ³n con nuestro LMS actual?',
      answer:
        'Ofrecemos integraciones nativas con los principales LMS del mercado, incluyendo SCORM, xAPI y LTI. Nuestro equipo de Customer Success te ayudarÃƒÂ¡ a configurar la integraciÃƒÂ³n durante el onboarding.',
    },
    {
      question: 'Ã‚Â¿QuÃƒÂ© incluye el soporte?',
      answer:
        'El soporte varÃƒÂ­a segÃƒÂºn tu plan. Team incluye soporte por email, Business incluye soporte prioritario con garantÃƒÂ­a de respuesta en 4 horas, y Enterprise incluye soporte 24/7 dedicado con un Customer Success Manager asignado.',
    },
    {
      question: 'Ã‚Â¿Puedo probar la plataforma antes de comprar?',
      answer:
        'Ã‚Â¡Absolutamente! Ofrecemos una prueba gratuita de 14 dÃƒÂ­as para todos los planes. No requiere tarjeta de crÃƒÂ©dito y tendrÃƒÂ¡s acceso completo a todas las funcionalidades del plan que elijas.',
    },
    {
      question: 'Ã‚Â¿Los certificados son reconocidos?',
      answer:
        'SÃƒÂ­, nuestros certificados son oficiales y verificables digitalmente. Incluyen cÃƒÂ³digos QR para validaciÃƒÂ³n en lÃƒÂ­nea y estÃƒÂ¡n diseÃƒÂ±ados para ser compartidos en LinkedIn y otros perfiles profesionales.',
    },
  ],
}
