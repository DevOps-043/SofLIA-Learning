import React from 'react';
import type { Step } from 'react-joyride';
import {
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Route,
  Sparkles,
  User,
} from 'lucide-react';

import {
  getBusinessUserDashboardTourTargetSelector,
  SHARED_TOUR_TARGET_IDS,
} from '../../../core/constants/tourTargets';

export const DASHBOARD_TOUR_ID = 'business-dashboard';

type BuildBusinessUserJoyrideStepsOptions = {
  isMobile: boolean;
};

export function buildBusinessUserJoyrideSteps({
  isMobile,
}: BuildBusinessUserJoyrideStepsOptions): Step[] {
  return [
    {
      target: getBusinessUserDashboardTourTargetSelector('heroSection'),
      title: 'Bienvenido a tu espacio de aprendizaje',
      content:
        'Este es tu centro personal de desarrollo. Desde aqui puedes revisar progreso, continuar cursos y avanzar en tus metas.',
      placement: 'center',
      disableBeacon: true,
      data: {
        icon: <Sparkles className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector('statsSection'),
      title: 'Estadisticas generales',
      content:
        'Aqui tienes una vista rapida de tu actividad. Revisa cursos asignados, progreso y certificados.',
      placement: isMobile ? 'top' : 'bottom',
      disableBeacon: true,
      data: {
        icon: <BarChart3 className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector('statCourses'),
      title: 'Tus cursos',
      content:
        'Consulta los cursos asignados y su estado actual para mantener el seguimiento de tu formacion.',
      placement: isMobile ? 'bottom' : 'top',
      disableBeacon: true,
      data: {
        icon: <BookOpen className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector('statCertificates'),
      title: 'Tus certificados',
      content:
        'Visualiza los certificados obtenidos y el avance que ya has completado.',
      placement: isMobile ? 'bottom' : 'top',
      disableBeacon: true,
      data: {
        icon: <Award className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector(
        isMobile ? 'mobileMenuTrigger' : 'userDropdownTrigger',
      ),
      title: 'Menu de usuario',
      content:
        'Desde este menu accedes a herramientas clave como perfil, idioma y accesos personales.',
      placement: isMobile ? 'bottom' : 'bottom-end',
      disableBeacon: true,
      data: {
        icon: <User className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector('courseViewSwitcher'),
      title: 'Vistas de tus cursos',
      content:
        'Cambia entre cuadricula, lista y learning paths. En learning paths puedes ver tus rutas de aprendizaje, el orden recomendado de los cursos, bloqueos y progreso de cada ruta.',
      placement: isMobile ? 'top' : 'left',
      disableBeacon: true,
      data: {
        icon: <Route className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: `#${SHARED_TOUR_TARGET_IDS.liaTrigger}`,
      title: 'Tu asistente SofLIA',
      content:
        'SofLIA esta aqui para resolver dudas, darte contexto y acompanarte durante tu aprendizaje.',
      placement: isMobile ? 'top' : 'top-end',
      disableBeacon: true,
      disableScrolling: true,
      spotlightPadding: isMobile ? 0 : 20,
      data: {
        icon: <Bot className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
  ];
}

export const businessUserJoyrideSteps = buildBusinessUserJoyrideSteps({
  isMobile: false,
});
