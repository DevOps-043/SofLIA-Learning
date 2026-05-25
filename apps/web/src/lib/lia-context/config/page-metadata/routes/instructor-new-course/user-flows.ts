import type { UserFlow } from '../../types';

export const instructorNewCourseUserFlows: UserFlow[] = [
      {
        name: 'Crear curso completo',
        steps: [
          '1. Información básica (título, descripción)',
          '2. Configurar precio y categoría',
          '3. Agregar módulos',
          '4. Agregar lecciones con videos',
          '5. Revisar y publicar'
        ],
        commonBreakpoints: [
          'Paso 4: Video no sube',
          'Paso 5: Error al publicar'
        ]
      }
    ];
