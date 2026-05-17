import type { ComponentInfo } from '../../types';

export const adminWorkshopsComponents: ComponentInfo[] = [
      {
        name: 'AdminWorkshopsPage',
        path: 'apps/web/src/app/admin/workshops/page.tsx',
        description: 'Gestión de talleres y eventos en vivo',
        props: [],
        commonErrors: [
          'Talleres no cargan: Error en API',
          'Calendario no sincroniza: Error de integración'
        ]
      }
    ];
