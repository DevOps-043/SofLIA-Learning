import React from 'react';
import type { Step } from 'react-joyride';
import {
  BookOpen,
  Bot,
  Film,
  ListFilter,
  Menu,
  Route,
  Sparkles,
  User,
} from 'lucide-react';

import {
  getBusinessUserDashboardTourTargetSelector,
  SHARED_TOUR_TARGET_IDS,
} from '../../../core/constants/tourTargets';

export const DASHBOARD_TOUR_ID = 'business-dashboard';

export const BUSINESS_USER_TOUR_STEP_BEHAVIOR = {
  openUserMenu: 'open-user-menu',
  showLearningPaths: 'show-learning-paths',
} as const;

type BuildBusinessUserJoyrideStepsOptions = {
  isMobile: boolean;
  hasCourseControls?: boolean;
  hasLearningPaths?: boolean;
};

const tourIconClassName = 'h-5 w-5 text-[var(--color-accent)]';

export function buildBusinessUserJoyrideSteps({
  hasCourseControls = true,
  hasLearningPaths = true,
  isMobile,
  t = (key) => key,
}: BuildBusinessUserJoyrideStepsOptions): Step[] {
  const steps: Step[] = [
    {
      target: getBusinessUserDashboardTourTargetSelector('heroSection'),
      title: t('dashboardTour.steps.welcome.title'),
      content: t('dashboardTour.steps.welcome.content'),
      placement: 'center',
      disableBeacon: true,
      data: {
        icon: <Sparkles className={tourIconClassName} />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector(
        isMobile ? 'mobileMenuTrigger' : 'userDropdownTrigger',
      ),
      title: 'Acceso a tu menu',
      content:
        'Abre tu menu personal desde aqui. Es el acceso rapido a perfil, certificados, estadisticas, idioma, tema y cierre de sesion.',
      placement: isMobile ? 'bottom' : 'bottom-end',
      disableBeacon: true,
      data: {
        icon: <User className={tourIconClassName} />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector(
        isMobile ? 'mobileMenuPanel' : 'userDropdownMenu',
      ),
      title: 'Menu desplegable del usuario',
      content:
        'Dentro del menu encuentras tus accesos personales: editar perfil, entrar al planificador, revisar certificados o estadisticas, cambiar idioma y ajustar el tema.',
      placement: isMobile ? 'bottom' : 'left',
      disableBeacon: true,
      data: {
        behavior: BUSINESS_USER_TOUR_STEP_BEHAVIOR.openUserMenu,
        icon: <Menu className={tourIconClassName} />,
      },
    },
  ];

  if (hasCourseControls) {
    steps.push({
      target: getBusinessUserDashboardTourTargetSelector('courseViewSwitcher'),
      title: 'Filtros y vistas de cursos',
      content:
        'Usa estos controles para cambiar entre la vista de cuadricula y lista. Si tienes learning paths asignados, la vista de cuadricula muestra tus rutas de aprendizaje.',
      placement: isMobile ? 'top' : 'left',
      disableBeacon: true,
      data: {
        icon: <ListFilter className={tourIconClassName} />,
      },
    });
  }

  if (hasLearningPaths) {
    steps.push(
      {
        target: getBusinessUserDashboardTourTargetSelector('learningPathSection'),
        title: 'Tus learning paths',
        content:
          'Las rutas ordenan tus cursos por secuencia recomendada. Aqui puedes ver tu avance, que curso sigue y cuales estan bloqueados hasta completar pasos anteriores.',
        placement: isMobile ? 'top' : 'top',
        disableBeacon: true,
        data: {
          behavior: BUSINESS_USER_TOUR_STEP_BEHAVIOR.showLearningPaths,
          icon: <Route className={tourIconClassName} />,
        },
      },
      {
        target: getBusinessUserDashboardTourTargetSelector('learningPathIntroVideo'),
        title: 'Video introductorio de la ruta',
        content:
          'Este boton abre el video introductorio del learning path cuando tu organizacion lo configura. Asi puedes entender el objetivo de la ruta antes de avanzar.',
        placement: isMobile ? 'top' : 'left',
        disableBeacon: true,
        data: {
          behavior: BUSINESS_USER_TOUR_STEP_BEHAVIOR.showLearningPaths,
          icon: <Film className={tourIconClassName} />,
        },
      },
      {
        target: getBusinessUserDashboardTourTargetSelector('learningPathSection'),
        title: 'Cursos dentro del learning path',
        content:
          'Cada tarjeta muestra el curso, su posicion en la ruta y su estado. Avanza en orden para desbloquear los siguientes cursos y conservar un progreso claro.',
        placement: isMobile ? 'top' : 'bottom',
        disableBeacon: true,
        data: {
          behavior: BUSINESS_USER_TOUR_STEP_BEHAVIOR.showLearningPaths,
          icon: <BookOpen className={tourIconClassName} />,
        },
      },
    );
  }

  steps.push(
    {
      target: `#${SHARED_TOUR_TARGET_IDS.liaTrigger}`,
      title: t('dashboardTour.steps.soflia.title'),
      content: t('dashboardTour.steps.soflia.content'),
      placement: isMobile ? 'top' : 'top-end',
      disableBeacon: true,
      disableScrolling: true,
      spotlightPadding: isMobile ? 0 : 20,
      data: {
        icon: <Bot className={tourIconClassName} />,
      },
    },
  );

  return steps;
}

export const businessUserJoyrideSteps = buildBusinessUserJoyrideSteps({
  isMobile: false,
});
