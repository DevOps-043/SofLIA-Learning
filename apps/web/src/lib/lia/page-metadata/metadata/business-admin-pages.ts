import type { PageMetadata } from '../types';

export const BusinessAdminPagesMetadata: Record<string, PageMetadata> = {
  '/business-panel': {
    path: '/business-panel',
    title: 'Panel de Negocios - Dashboard',
    description: 'Dashboard principal del panel de administración empresarial. Muestra estadísticas generales: cursos asignados, en progreso, completados y certificados emitidos.',
    category: 'negocios',
    keywords: ['business', 'empresa', 'dashboard', 'estadísticas', 'administración', 'panel empresarial'],
    availableActions: ['Ver estadísticas generales', 'Ver cursos asignados', 'Ver actividad reciente', 'Navegar a secciones'],
    relatedPages: ['/business-panel/hierarchy', '/business-panel/users', '/business-panel/courses', '/business-panel/reports'],
    features: ['Estadísticas de cursos', 'Métricas de progreso', 'Widgets de actividad', 'Gráficos de rendimiento'],
    contentSections: ['Tarjetas de estadísticas', 'Cursos en catálogo', 'Actividad reciente'],
    isBusinessOnly: true,
    allowedRoles: ['business', 'administrador']
  },
  '/business-panel/dashboard': {
    path: '/business-panel/dashboard',
    title: 'Panel de Negocios - Dashboard',
    description: 'Vista principal del panel empresarial con métricas clave de formación corporativa.',
    category: 'negocios',
    keywords: ['dashboard', 'métricas', 'empresa', 'estadísticas'],
    availableActions: ['Ver progreso general', 'Ver actividad', 'Acceder a reportes'],
    relatedPages: ['/business-panel/hierarchy', '/business-panel/users', '/business-panel/courses'],
    features: ['Estadísticas en tiempo real', 'Rankings de aprendizaje', 'Gráficos interactivos'],
    isBusinessOnly: true,
    allowedRoles: ['business', 'administrador']
  },
  '/business-panel/hierarchy': {
    path: '/business-panel/hierarchy',
    title: 'Jerarquía Organizacional',
    description: 'Gestionar la estructura jerárquica de la organización: Regiones, Zonas y Equipos. Crear, editar y organizar la estructura completa de la empresa.',
    category: 'negocios',
    keywords: ['jerarquía', 'hierarchy', 'regiones', 'zonas', 'equipos', 'estructura organizacional'],
    availableActions: ['Crear región', 'Crear zona', 'Crear equipo', 'Editar estructura', 'Asignar usuarios', 'Ver árbol jerárquico'],
    relatedPages: ['/business-panel/users', '/business-panel/courses', '/business-panel/reports'],
    features: ['Árbol de jerarquía visual', 'Gestión de regiones, zonas y equipos', 'Asignación de usuarios a equipos', 'Estadísticas por nivel'],
    contentSections: ['Árbol de jerarquía', 'Lista de regiones', 'Lista de zonas', 'Lista de equipos', 'Estadísticas'],
    specialNotes: 'La jerarquía organiza la empresa en tres niveles: Regiones (nivel superior), Zonas (nivel intermedio) y Equipos (nivel más bajo). Los usuarios se asignan a equipos.',
    isBusinessOnly: true,
    allowedRoles: ['business', 'administrador']
  },
  '/business-panel/users': {
    path: '/business-panel/users',
    title: 'Gestión de Usuarios',
    description: 'Administrar empleados de la organización: invitar, editar, eliminar, importar masivamente y ver estadísticas individuales.',
    category: 'negocios',
    keywords: ['usuarios', 'empleados', 'invitar', 'importar', 'CSV', 'roles', 'estadísticas'],
    availableActions: ['Agregar usuario', 'Editar usuario', 'Eliminar usuario', 'Importar CSV', 'Ver estadísticas', 'Asignar a equipo', 'Cambiar rol'],
    relatedPages: ['/business-panel/hierarchy', '/business-panel/courses'],
    features: ['Modal: Agregar Usuario', 'Modal: Editar Usuario', 'Modal: Eliminar Usuario', 'Modal: Importar CSV', 'Modal: Estadísticas de Usuario', 'Tabla de usuarios con filtros'],
    contentSections: ['Tabla de usuarios', 'Filtros y búsqueda', 'Acciones en lote'],
    specialNotes: 'Roles disponibles: Administrador (acceso total), Manager (solo su equipo), Estudiante (solo sus cursos). La importación CSV permite cargar múltiples empleados de una vez.',
    isBusinessOnly: true,
    allowedRoles: ['business', 'administrador']
  }
};
