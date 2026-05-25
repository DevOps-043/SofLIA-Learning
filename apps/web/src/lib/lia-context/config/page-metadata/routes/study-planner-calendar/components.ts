import type { ComponentInfo } from '../../types';

export const studyPlannerCalendarComponents: ComponentInfo[] = [
      {
        name: 'CalendarPage',
        path: 'apps/web/src/app/study-planner/calendar/page.tsx',
        description: 'Vista de calendario del plan de estudio',
        props: [],
        commonErrors: ['Eventos no cargan', 'Drag and drop no funciona']
      }
    ];
