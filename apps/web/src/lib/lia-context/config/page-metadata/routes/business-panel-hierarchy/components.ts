import type { ComponentInfo } from '../../types';

export const businessPanelHierarchyComponents: ComponentInfo[] = [
      {
        name: 'BusinessHierarchyPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/hierarchy/page.tsx',
        description: 'Gestión de estructura jerárquica (equipos, zonas, regiones)',
        props: [],
        commonErrors: [
          'Árbol no carga: Error en API de jerarquía',
          'Drag & drop no funciona: Error de JavaScript'
        ]
      }
    ];
