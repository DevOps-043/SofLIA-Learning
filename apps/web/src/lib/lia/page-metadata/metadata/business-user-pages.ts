import type { PageMetadata } from '../types';

export const BusinessUserPagesMetadata: Record<string, PageMetadata> = {
  '/business-user/dashboard': {
    path: '/business-user/dashboard',
    title: 'Dashboard del Empleado',
    description: 'Vista personalizada para empleados: cursos asignados por la empresa, progreso personal, fechas límite, certificados obtenidos.',
    category: 'negocios',
    keywords: ['empleado', 'cursos asignados', 'progreso', 'deadline', 'certificados'],
    availableActions: ['Ver cursos asignados', 'Ver progreso', 'Ver fechas límite', 'Descargar certificados', 'Continuar aprendizaje'],
    relatedPages: ['/business-user/dashboard'],
    features: ['Branding corporativo', 'Cursos obligatorios', 'Indicadores de deadline', 'Certificados'],
    contentSections: ['Mis cursos asignados', 'Progreso', 'Próximas fechas', 'Logros'],
    specialNotes: 'Esta vista tiene el branding (logo y colores) de la empresa configurado por el administrador.',
    isBusinessOnly: true,
    allowedRoles: ['business user', 'business', 'administrador']
  }
};
