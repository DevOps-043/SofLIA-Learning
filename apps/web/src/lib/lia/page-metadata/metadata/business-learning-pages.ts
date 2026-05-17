import type { PageMetadata } from '../types';

export const BusinessLearningPagesMetadata: Record<string, PageMetadata> = {
  '/business-panel/courses': {
    path: '/business-panel/courses',
    title: 'Catálogo y Asignación de Cursos',
    description: 'Ver el catálogo de cursos disponibles y asignarlos a usuarios individuales o equipos completos. Configurar fechas límite con ayuda de SofLIA.',
    category: 'negocios',
    keywords: ['cursos', 'asignar', 'catálogo', 'formación', 'capacitación', 'deadline', 'fecha límite'],
    availableActions: ['Ver catálogo', 'Asignar curso a usuario', 'Asignar curso a equipo', 'Configurar fecha límite', 'Usar sugerencias de SofLIA'],
    relatedPages: ['/business-panel/hierarchy', '/business-panel/users', '/business-panel/reports'],
    features: ['Grid de cursos', 'Modal: Asignar Curso (con pestañas Usuarios/Equipos)', 'Modal: Sugerencias de Fecha SofLIA', 'Configuración de deadline'],
    contentSections: ['Catálogo de cursos', 'Filtros', 'Indicadores de progreso'],
    specialNotes: 'El botón "✨ Sugerir con IA" abre un modal donde SofLIA recomienda fechas límite según 3 enfoques: Rápido (⚡), Equilibrado (⚖️) o Largo (🌱).',
    isBusinessOnly: true,
    allowedRoles: ['business', 'administrador']
  },
  '/business-panel/reports': {
    path: '/business-panel/reports',
    title: 'Reportes y Analytics',
    description: 'Panel unificado para reconstruir desde cero reportes, métricas y exportaciones del Business Panel.',
    category: 'negocios',
    keywords: ['reportes', 'analytics', 'métricas', 'exportar', 'datos'],
    availableActions: ['Abrir panel unificado'],
    relatedPages: ['/business-panel/hierarchy', '/business-panel/users', '/business-panel/courses'],
    features: ['Nueva base de reportes y analytics'],
    isBusinessOnly: true,
    allowedRoles: ['business', 'administrador']
  },
  '/business-panel/settings': {
    path: '/business-panel/settings',
    title: 'Configuración Empresarial',
    description: 'Configurar datos de la empresa, personalizar branding (logo, colores), personalizar certificados, gestionar suscripción.',
    category: 'negocios',
    keywords: ['configuración', 'settings', 'branding', 'logo', 'colores', 'certificados', 'suscripción'],
    availableActions: ['Editar datos empresa', 'Subir logo', 'Cambiar colores', 'Personalizar certificados', 'Ver plan de suscripción', 'Gestionar facturación'],
    relatedPages: ['/business-panel/subscription'],
    features: ['Pestañas: General, Branding, Certificados, Suscripción', 'Modal: Ajustar imagen', 'Selector de colores', 'Vista previa en tiempo real'],
    contentSections: ['Información general', 'Personalización visual', 'Diseño de certificados', 'Planes y facturación'],
    specialNotes: 'El branding (logo y colores) se aplica automáticamente a la vista de los empleados (business-user) para mantener la identidad corporativa.',
    isBusinessOnly: true,
    allowedRoles: ['business', 'administrador']
  },
  '/business-panel/subscription': {
    path: '/business-panel/subscription',
    title: 'Suscripción y Facturación',
    description: 'Ver plan actual, comparar planes disponibles, gestionar métodos de pago, descargar facturas.',
    category: 'negocios',
    keywords: ['suscripción', 'plan', 'facturación', 'pago', 'upgrade'],
    availableActions: ['Ver plan actual', 'Comparar planes', 'Cambiar plan', 'Agregar método de pago', 'Descargar facturas'],
    relatedPages: ['/business-panel/settings'],
    features: ['Comparador de planes', 'Historial de facturas', 'Gestión de pagos'],
    isBusinessOnly: true,
    allowedRoles: ['business', 'administrador']
  },
  '/business-panel/progress': {
    path: '/business-panel/progress',
    title: 'Progreso por Equipos',
    description: 'Vista consolidada del progreso de formación por equipos. Alertas de usuarios rezagados.',
    category: 'negocios',
    keywords: ['progreso', 'equipos', 'avance', 'alertas'],
    availableActions: ['Ver progreso por equipo', 'Identificar rezagados', 'Ver tendencias'],
    relatedPages: ['/business-panel/hierarchy', '/business-panel/reports'],
    features: ['Métricas visuales', 'Alertas automáticas', 'Comparativas'],
    isBusinessOnly: true,
    allowedRoles: ['business', 'administrador']
  }
};
