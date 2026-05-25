import type { ComponentInfo } from '../../types';

export const authSelectOrgComponents: ComponentInfo[] = [
      {
        name: 'SelectOrganizationPage',
        path: 'apps/web/src/app/auth/select-organization/page.tsx',
        description: 'Selección de organización para usuarios con múltiples',
        props: [],
        commonErrors: ['Organizaciones no cargan', 'Selección no funciona']
      }
    ];
