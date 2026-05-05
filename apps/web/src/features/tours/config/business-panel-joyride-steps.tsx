'use client';

import { Step } from 'react-joyride';
import React from 'react';
import { 
  LayoutDashboard, 
  Navigation, 
  BarChart3, 
  Activity, 
  Zap, 
  Bot,
  Sparkles,
  Users,
  BookOpen,
  Route,
  Network,
  ClipboardCheck,
  Settings
} from 'lucide-react';
import { TFunction } from 'i18next';

// Tour ID for the Business Panel (Manager/Admin View)
export const BUSINESS_PANEL_TOUR_ID = 'business-panel-tour';

/**
 * Generates the tour steps for the Business Panel
 * @param t Translation function from i18next
 * @returns Array of Joyride steps
 */
export const getBusinessPanelJoyrideSteps = (t: TFunction): Step[] => [
  {
    target: '#tour-hero-section',
    title: t('adminTour.steps.hero.title', 'Panel de Gestión Empresarial'),
    content: t('adminTour.steps.hero.content', 'Bienvenido a tu centro de comando. Desde aquí podrás gestionar toda tu organización, supervisar el progreso de los usuarios y administrar el contenido educativo.'),
    placement: 'center',
    disableBeacon: true,
    data: {
      icon: <LayoutDashboard className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-sidebar-nav',
    title: t('adminTour.steps.sidebar.title', 'Navegación Principal'),
    content: t('adminTour.steps.sidebar.content', 'En este menú encontrarás todas las herramientas necesarias: gestión de usuarios, creación de cursos, reportes detallados y configuración de equipos.'),
    placement: 'right',
    disableBeacon: true,
    data: {
      icon: <Navigation className="w-5 h-5 text-accent" />
    }
  },
  // Individual Sidebar Items
  {
    target: '#tour-nav-dashboard',
    title: t('adminTour.steps.navDashboard.title', 'Dashboard'),
    content: t('adminTour.steps.navDashboard.content', 'Vista general del rendimiento de la organización, métricas clave y actividad reciente de tus equipos.'),
    placement: 'right',
    disableBeacon: true,
    data: {
      icon: <LayoutDashboard className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-nav-users',
    title: t('adminTour.steps.navUsers.title', 'Usuarios'),
    content: t('adminTour.steps.navUsers.content', 'Gestiona los miembros de tu organización, administra roles, envía invitaciones y consulta perfiles individuales.'),
    placement: 'right',
    disableBeacon: true,
    data: {
      icon: <Users className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-nav-courses',
    title: t('adminTour.steps.navCourses.title', 'Cursos'),
    content: t('adminTour.steps.navCourses.content', 'Explora la biblioteca de cursos disponibles, asigna contenidos a tus colaboradores y supervisa el avance general.'),
    placement: 'right',
    disableBeacon: true,
    data: {
      icon: <BookOpen className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-nav-learning-paths',
    title: t('adminTour.steps.navLearningPaths.title', 'Rutas de Aprendizaje'),
    content: t('adminTour.steps.navLearningPaths.content', 'Organiza cursos en secuencias lógicas para guiar el desarrollo profesional de tus equipos de manera estructurada.'),
    placement: 'right',
    disableBeacon: true,
    data: {
      icon: <Route className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-nav-hierarchy',
    title: t('adminTour.steps.navHierarchy.title', 'Estructura Organizacional'),
    content: t('adminTour.steps.navHierarchy.content', 'Define la jerarquía de tu empresa mediante regiones, zonas y equipos para una gestión granular y reportes segmentados.'),
    placement: 'right',
    disableBeacon: true,
    data: {
      icon: <Network className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-nav-reports',
    title: t('adminTour.steps.navReports.title', 'Reportes y Analytics'),
    content: t('adminTour.steps.navReports.content', 'Accede a datos profundos sobre el impacto del aprendizaje, exporta informes y analiza el ROI de tu capacitación.'),
    placement: 'right',
    disableBeacon: true,
    data: {
      icon: <BarChart3 className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-nav-reviews',
    title: t('adminTour.steps.navReviews.title', 'Revisiones y Seguimiento'),
    content: t('adminTour.steps.navReviews.content', 'Supervisa tareas, actividades y progresos que requieren validación o atención especial por parte de los administradores.'),
    placement: 'right',
    disableBeacon: true,
    data: {
      icon: <ClipboardCheck className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-nav-settings',
    title: t('adminTour.steps.navSettings.title', 'Configuración'),
    content: t('adminTour.steps.navSettings.content', 'Personaliza la plataforma con tu branding (white-label), ajusta preferencias globales y gestiona la configuración técnica.'),
    placement: 'right',
    disableBeacon: true,
    data: {
      icon: <Settings className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-stats-section',
    title: t('adminTour.steps.stats.title', 'Métricas de Impacto'),
    content: t('adminTour.steps.stats.content', 'Visualiza en tiempo real el rendimiento de tu equipo. Monitoriza usuarios activos, cursos completados y el nivel de engagement general de la organización.'),
    placement: 'bottom',
    disableBeacon: true,
    data: {
      icon: <BarChart3 className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-activity-title',
    title: t('adminTour.steps.activity.title', 'Actividad Reciente'),
    content: t('adminTour.steps.activity.content', 'Mantente al tanto de lo último que ocurre. Aquí verás quién ha completado un curso, obtenido un certificado o iniciado sesión recientemente.'),
    placement: 'bottom',
    disableBeacon: true,
    data: {
      icon: <Activity className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-quick-actions',
    title: t('adminTour.steps.quickActions.title', 'Acciones Rápidas'),
    content: t('adminTour.steps.quickActions.content', 'Accesos directos para las tareas más frecuentes: Gestionar usuarios, Asignar cursos, Ver reportes detallados y Configuraciones del sistema.'),
    placement: 'left-start',
    disableBeacon: true,
    data: {
      icon: <Zap className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#lia-tour-trigger-stable',
    title: t('adminTour.steps.soflia.title', 'Asistente SofLIA'),
    content: t('adminTour.steps.soflia.content', 'Tu asistente personal inteligente disponible 24/7. SofLIA puede analizar datos de tus equipos, generar reportes narrativos y responder cualquier duda sobre la plataforma.'),
    placement: 'top-end',
    disableBeacon: true,
    disableScrolling: true,
    spotlightPadding: 20,
    data: {
      icon: <Bot className="w-5 h-5 text-accent" />
    }
  },
  {
    target: 'body',
    title: t('adminTour.steps.finish.title', '¡Todo Listo!'),
    content: t('adminTour.steps.finish.content', 'Ya conoces lo básico. Explora las secciones del menú lateral para profundizar en cada área. ¡Empieza a potenciar el aprendizaje de tu equipo!'),
    placement: 'center',
    disableBeacon: true,
    data: {
      icon: <Sparkles className="w-5 h-5 text-accent" />
    }
  },
];
