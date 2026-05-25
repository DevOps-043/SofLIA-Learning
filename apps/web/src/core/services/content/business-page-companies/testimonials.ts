import type { BusinessPageContent } from '@aprende-y-aplica/shared'

type CompanyTestimonial = BusinessPageContent['companies']['testimonials'][number]

export const companyTestimonials: CompanyTestimonial[] = [
  {
    id: 'company-testimonial-1',
    quote:
      'Implementar SofLIA Business ha sido una de las mejores decisiones. Nuestro equipo ahora domina las herramientas de IA mÃƒÂ¡s relevantes.',
    author: 'Roberto Silva',
    role: 'CTO, TechSolutions Inc.',
  },
  {
    id: 'company-testimonial-2',
    quote:
      'Los reportes detallados nos permiten medir el ROI real de la capacitaciÃƒÂ³n. Hemos visto un aumento del 40% en productividad.',
    author: 'Patricia LÃƒÂ³pez',
    role: 'CHRO, Innovation Group',
  },
  {
    id: 'company-testimonial-3',
    quote:
      'El soporte dedicado y la personalizaciÃƒÂ³n del contenido superaron nuestras expectativas. Altamente recomendado.',
    author: 'Miguel Torres',
    role: 'CEO, Digital Transform Co.',
  },
]
