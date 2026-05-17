import type { PageMetadata } from '../types';

export const CorePagesMetadata: Record<string, PageMetadata> = {
  '/courses/[slug]': {
    path: '/courses/[slug]',
    title: 'Detalle de Curso',
    description: 'Página de detalle de un curso específico donde puedes ver información completa, adquirir el curso o acceder si ya lo tienes',
    category: 'educacion',
    keywords: ['curso', 'detalle', 'información', 'adquirir', 'comprar'],
    availableActions: ['Ver detalles', 'Adquirir curso', 'Agregar al carrito', 'Acceder al curso'],
    relatedPages: ['/dashboard', '/courses/[slug]/learn'],
    features: ['Vista detallada del curso', 'Adquisición de cursos', 'Información del instructor']
  },
  '/communities': {
    path: '/communities',
    title: 'Comunidades',
    description: 'Espacio para unirse a comunidades, networking y participación grupal',
    category: 'social',
    keywords: ['comunidades', 'networking', 'grupos', 'colaboración', 'miembros'],
    availableActions: ['Buscar comunidades', 'Filtrar por categoría', 'Ver detalles', 'Unirse', 'Solicitar acceso', 'Ver normas'],
    relatedPages: ['/communities/[slug]', '/communities/[slug]/members', '/communities/[slug]/leagues'],
    features: ['Búsqueda de comunidades', 'Filtros por categorías', 'Sistema de unirse/solicitar acceso', 'Estadísticas globales', 'Modal de detalles', 'Modal de normas'],
    contentSections: ['Búsqueda y filtros', 'Cards de comunidades', 'Estadísticas globales', 'Modales de detalles y normas']
  },
  '/dashboard': {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'Panel principal del usuario con catálogo completo de talleres y cursos disponibles. Aquí puedes explorar todos los cursos, filtrar por categoría, agregar a favoritos y al carrito.',
    category: 'navegacion',
    keywords: ['dashboard', 'inicio', 'panel', 'resumen', 'talleres', 'cursos', 'catálogo de cursos', 'cursos disponibles', 'todos los cursos'],
    availableActions: ['Ver talleres', 'Ver todos los cursos', 'Filtrar por categoría', 'Agregar a favoritos', 'Agregar al carrito', 'Ver detalles', 'Acceder a cursos comprados'],
    relatedPages: ['/courses/[slug]', '/courses/[slug]/learn', '/statistics', '/news', '/cart'],
    features: ['Catálogo completo de cursos/talleres', 'Filtros por categorías dinámicas', 'Sistema de favoritos', 'Estadísticas rápidas', 'Actividad reciente'],
    contentSections: ['Grid de talleres/cursos disponibles', 'Sidebar con estadísticas', 'Actividad reciente', 'Filtros de categorías'],
    specialNotes: 'IMPORTANTE: El Dashboard (/dashboard) es donde se encuentra el CATÁLOGO COMPLETO de todos los cursos y talleres disponibles. Cuando el usuario pregunte sobre "ver todos los cursos" o "cursos disponibles", debe dirigirse al Dashboard, NO a /courses (que no existe como página de catálogo). La ruta /courses/[slug] es solo para ver el detalle de un curso específico.'
  },
  '/news': {
    path: '/news',
    title: 'Noticias',
    description: 'Últimas noticias, actualizaciones y tendencias sobre IA y tecnología',
    category: 'contenido',
    keywords: ['noticias', 'artículos', 'reels', 'actualizaciones', 'tendencias'],
    availableActions: ['Leer artículos', 'Ver reels', 'Buscar', 'Filtrar por categoría', 'Cambiar modo de vista', 'Ver noticias destacadas'],
    relatedPages: ['/news/[slug]', '/reels'],
    features: ['Búsqueda de noticias', 'Filtros por categoría/idioma', 'Modo grid/lista', 'Pestañas Noticias/Reels'],
    contentSections: ['Noticias destacadas', 'Pestaña de Reels', 'Grid/Lista de noticias'],
    specialNotes: 'IMPORTANTE: Esta página tiene dos pestañas principales - "Noticias" para artículos escritos y "Reels" para videos cortos. Los reels están integrados dentro de esta página.'
  }
};
