import type { UserFlow } from '../../types';

export const adminReportesUserFlows: UserFlow[] = [
      {
        name: 'Revisar y resolver reporte',
        steps: [
          '1. Filtrar reportes por estado "Pendiente"',
          '2. Abrir detalle del reporte',
          '3. Ver grabación de sesión si existe',
          '4. Asignar prioridad',
          '5. Agregar notas y marcar como resuelto'
        ],
        commonBreakpoints: [
          'Paso 3: Grabación no disponible',
          'Paso 5: Error guardando cambios'
        ]
      }
    ];
