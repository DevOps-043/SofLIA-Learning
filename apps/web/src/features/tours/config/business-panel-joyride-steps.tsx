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
  Sparkles
} from 'lucide-react';

// Tour ID for the Business Panel (Manager/Admin View)
export const BUSINESS_PANEL_TOUR_ID = 'business-panel-tour';

// Steps for React Joyride with professional icons
export const businessPanelJoyrideSteps: Step[] = [
  {
    target: '#tour-hero-section',
    title: 'Panel de Gestión Empresarial',
    content: 'Bienvenido a tu centro de comando. Desde aquí podrás gestionar toda tu organización, supervisar el progreso de los usuarios y administrar el contenido educativo.',
    placement: 'center',
    disableBeacon: true,
    data: {
      icon: <LayoutDashboard className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-sidebar-nav',
    title: 'Navegación Principal',
    content: 'En este menú encontrarás todas las herramientas necesarias: gestión de usuarios, creación de cursos, reportes detallados y configuración de equipos.',
    placement: 'right',
    disableBeacon: true,
    data: {
      icon: <Navigation className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-stats-section',
    title: 'Métricas de Impacto',
    content: 'Visualiza en tiempo real el rendimiento de tu equipo. Monitoriza usuarios activos, cursos completados y el nivel de engagement general de la organización.',
    placement: 'bottom',
    disableBeacon: true,
    data: {
      icon: <BarChart3 className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-activity-title',
    title: 'Actividad Reciente',
    content: 'Mantente al tanto de lo último que ocurre. Aquí verás quién ha completado un curso, obtenido un certificado o iniciado sesión recientemente.',
    placement: 'bottom',
    disableBeacon: true,
    data: {
      icon: <Activity className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-quick-actions',
    title: 'Acciones Rápidas',
    content: 'Accesos directos para las tareas más frecuentes: Gestionar usuarios, Asignar cursos, Ver reportes detallados y Configuraciones del sistema.',
    placement: 'left-start',
    disableBeacon: true,
    data: {
      icon: <Zap className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-lia-button',
    title: 'Asistente SofLIA',
    content: 'Tu asistente inteligente siempre está disponible. SofLIA puede ayudarte a resolver dudas sobre la plataforma, generar ideas para planes de carrera y sugerir cursos basados en roles.',
    placement: 'top',
    disableBeacon: true,
    data: {
      icon: <Bot className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: 'body',
    title: '¡Todo Listo!',
    content: 'Ya conoces lo básico. Explora las secciones del menú lateral para profundizar en cada área. ¡Empieza a potenciar el aprendizaje de tu equipo!',
    placement: 'center',
    disableBeacon: true,
    data: {
      icon: <Sparkles className="w-5 h-5 text-[#00D4B3]" />
    }
  },
];
