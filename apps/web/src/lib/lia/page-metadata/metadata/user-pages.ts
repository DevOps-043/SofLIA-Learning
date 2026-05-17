import type { PageMetadata } from '../types';

export const UserPagesMetadata: Record<string, PageMetadata> = {
  '/profile': {
    path: '/profile',
    title: 'Perfil',
    description: 'Configuración de perfil de usuario, preferencias y datos personales. También conocida como "Editar perfil"',
    category: 'configuracion',
    keywords: ['perfil', 'editar perfil', 'configuración', 'datos personales', 'preferencias', 'cuenta'],
    availableActions: ['Editar información personal', 'Subir foto', 'Subir CV', 'Actualizar enlaces sociales', 'Guardar cambios'],
    relatedPages: ['/certificates', '/account-settings', '/statistics'],
    features: ['Gestión de avatar', 'Información personal y profesional', 'Enlaces sociales', 'Subida de CV', 'Puntos del usuario'],
    contentSections: ['Avatar y foto de perfil', 'Información personal', 'Información profesional', 'Enlaces sociales', 'CV'],
    specialNotes: 'Esta página también se conoce como "Editar perfil". Aquí puedes gestionar toda tu información personal y profesional.'
  },
  '/statistics': {
    path: '/statistics',
    title: 'Estadísticas',
    description: 'Visualización de estadísticas y métricas de aprendizaje',
    category: 'analisis',
    keywords: ['estadísticas', 'métricas', 'progreso', 'análisis', 'aprendizaje'],
    availableActions: ['Ver progreso', 'Analizar datos', 'Ver métricas de aprendizaje'],
    relatedPages: ['/dashboard', '/profile'],
    features: ['Visualización de métricas', 'Análisis de progreso', 'Estadísticas de aprendizaje']
  },
  '/reels': {
    path: '/reels',
    title: 'Reels',
    description: 'Contenido en formato de video corto sobre IA y tecnología',
    category: 'contenido',
    keywords: ['reels', 'videos', 'cortos', 'IA', 'tecnología'],
    availableActions: ['Ver reels', 'Compartir', 'Interactuar'],
    relatedPages: ['/news', '/dashboard'],
    features: ['Reproducción de videos cortos', 'Sistema de interacción', 'Compartir contenido'],
    specialNotes: 'Los reels también están disponibles dentro de la página de Noticias en una pestaña dedicada'
  },
  '/certificates': {
    path: '/certificates',
    title: 'Certificados',
    description: 'Certificados obtenidos por completar cursos y talleres',
    category: 'logros',
    keywords: ['certificados', 'logros', 'completado', 'diplomas', 'reconocimiento'],
    availableActions: ['Ver certificados', 'Descargar', 'Compartir', 'Ver detalles'],
    relatedPages: ['/dashboard', '/profile', '/courses/[slug]'],
    features: ['Visualización de certificados', 'Descarga de certificados', 'Compartir certificados']
  },
  '/account-settings': {
    path: '/account-settings',
    title: 'Configuración de Cuenta',
    description: 'Configuración de notificaciones y privacidad',
    category: 'configuracion',
    keywords: ['configuración', 'notificaciones', 'privacidad', 'preferencias', 'cuenta'],
    availableActions: ['Configurar notificaciones', 'Ajustar privacidad', 'Guardar cambios'],
    relatedPages: ['/profile'],
    features: ['Configuración de notificaciones', 'Configuración de privacidad', 'Guardado de preferencias'],
    contentSections: ['Notificaciones', 'Privacidad']
  }
};
