import type { ComponentInfo } from '../../types';

export const adminCompaniesComponents: ComponentInfo[] = [
      {
        name: 'AdminCompaniesPage',
        path: 'apps/web/src/app/admin/companies/page.tsx',
        description: 'Gestión de empresas/organizaciones',
        props: [],
        commonErrors: [
          'Lista no carga: Error en API de empresas',
          'Filtros no funcionan: Error en query'
        ]
      },
      {
        name: 'CompanyCard',
        path: 'apps/web/src/features/admin/components/CompanyCard.tsx',
        description: 'Tarjeta de empresa con información resumida',
        props: ['company', 'onEdit', 'onViewUsers'],
        commonErrors: [
          'Imagen no carga: URL inválida',
          'Stats incorrectas: Datos no actualizados'
        ]
      }
    ];
