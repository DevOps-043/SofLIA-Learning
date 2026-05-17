import type { ComponentInfo } from '../../types';

export const studyPlannerDashboardComponents: ComponentInfo[] = [
      {
        name: 'StudyPlannerDashboardPage',
        path: 'apps/web/src/app/study-planner/dashboard/page.tsx',
        description: 'Dashboard del planificador de estudio',
        props: [],
        commonErrors: [
          'Dashboard vacío: Usuario sin plan de estudio',
          'Calendario no carga: Error en integración de calendario'
        ]
      },
      {
        name: 'StudyPlannerSofLIA',
        path: 'apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx',
        description: 'Componente de SofLIA especializado para el planificador',
        props: ['userId', 'pendingLessons', 'connectedCalendar'],
        commonErrors: [
          'SofLIA no genera plan: Datos insuficientes',
          'Plan no se guarda: Error en API'
        ]
      },
      {
        name: 'CalendarIntegration',
        path: 'apps/web/src/features/study-planner/components/CalendarIntegration.tsx',
        description: 'Integración con calendarios externos',
        props: ['provider', 'onConnect', 'onDisconnect'],
        commonErrors: [
          'OAuth falla: Token expirado o inválido',
          'Eventos no sincronizan: Permisos insuficientes'
        ]
      }
    ];
