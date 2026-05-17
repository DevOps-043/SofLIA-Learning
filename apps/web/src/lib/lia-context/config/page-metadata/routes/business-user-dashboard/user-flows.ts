import type { UserFlow } from '../../types';

export const businessUserDashboardUserFlows: UserFlow[] = [
      {
        name: 'Continuar un curso',
        steps: [
          '1. Identificar el curso en el dashboard',
          '2. Click en "Continuar" o en la tarjeta del curso',
          '3. Se abre el reproductor de lecciones',
          '4. Continuar desde donde se dejó'
        ],
        commonBreakpoints: [
          'Paso 2: Error al cargar el curso',
          'Paso 4: Lección no carga correctamente'
        ]
      },
      {
        name: 'Ver certificados obtenidos',
        steps: [
          '1. Navegar a la sección de certificados en el dashboard',
          '2. Click en un certificado para verlo',
          '3. Descargar o compartir certificado'
        ],
        commonBreakpoints: [
          'Paso 2: PDF no carga',
          'Paso 3: Error al descargar'
        ]
      }
    ];
