import type { ComponentInfo } from '../../types';

export const adminReportesComponents: ComponentInfo[] = [
      {
        name: 'AdminReportesPage',
        path: 'apps/web/src/app/admin/reportes/page.tsx',
        description: 'Gestión de reportes de problemas y bugs',
        props: [],
        commonErrors: [
          'Reportes no cargan: Error en API',
          'Filtros no funcionan: Query inválida'
        ]
      },
      {
        name: 'ReporteCard',
        path: 'apps/web/src/features/admin/components/ReporteCard.tsx',
        description: 'Tarjeta de reporte individual',
        props: ['reporte', 'onUpdate', 'onAssign'],
        commonErrors: [
          'Grabación no reproduce: Datos corruptos',
          'Screenshot no carga: URL expirada'
        ]
      }
    ];
