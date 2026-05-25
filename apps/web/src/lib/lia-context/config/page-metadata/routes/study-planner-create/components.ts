import type { ComponentInfo } from '../../types';

export const studyPlannerCreateComponents: ComponentInfo[] = [
      {
        name: 'CreatePlanPage',
        path: 'apps/web/src/app/study-planner/create/page.tsx',
        description: 'Creación de plan de estudio con LIA',
        props: [],
        commonErrors: ['LIA no responde', 'Plan no se genera', 'Calendario no conecta']
      }
    ];
