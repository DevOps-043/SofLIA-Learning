import { Step } from 'react-joyride';
import React from 'react';
import { 
  Sparkles, 
  BarChart3, 
  BookOpen, 
  Award, 
  User, 
  Bot,
  CalendarCheck
} from 'lucide-react';

export const DASHBOARD_TOUR_ID = 'business-dashboard';

export const businessUserJoyrideSteps: Step[] = [
  {
    target: '#tour-hero-section',
    title: '¡Bienvenido a tu Espacio de Aprendizaje!',
    content: 'Este es tu centro personal de desarrollo. Desde aquí podrás visualizar tu progreso, continuar tus cursos y alcanzar tus metas profesionales.',
    placement: 'center',
    disableBeacon: true,
    data: {
      icon: <Sparkles className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-stats-section',
    title: 'Estadísticas Generales',
    content: 'Aquí tienes una vista rápida de tu actividad. Revisa tus cursos asignados, el estado de tu progreso y los certificados que has ganado.',
    placement: 'bottom',
    disableBeacon: true,
    data: {
      icon: <BarChart3 className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-stat-courses',
    title: 'Tus Cursos',
    content: 'Consulta los cursos asignados y su estado actual. Mantén un seguimiento detallado de la formación.',
    placement: 'top',
    disableBeacon: true,
    data: {
      icon: <BookOpen className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-stat-certificates',
    title: 'Tus Certificados',
    content: 'Visualiza los certificados obtenidos y el crecimiento profesional de tu equipo.',
    placement: 'top',
    disableBeacon: true,
    data: {
      icon: <Award className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-user-dropdown-trigger',
    title: 'Menú de Usuario',
    content: 'En este menú encontrarás herramientas vitales: Planificador de Estudios, Editar Perfil y configuración de Idioma.',
    placement: 'bottom-end',
    disableBeacon: true,
    data: {
      icon: <User className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#lia-tour-trigger-stable',
    title: '¡Tu Asistente SofLIA!',
    content: 'SofLIA es lo más importante de tu experiencia. Está aquí 24/7 para resolver dudas, analizar tu progreso y recibir feedback.',
    placement: 'top-end',
    disableBeacon: true,
    disableScrolling: true,
    spotlightPadding: 20,
    data: {
      icon: <Bot className="w-5 h-5 text-[#00D4B3]" />
    }
  },
];
