import type { UserFlow } from '../../types';

export const businessPanelCoursesUserFlows: UserFlow[] = [
      {
        name: 'Asignar curso a usuarios individuales',
        steps: [
          '1. Navegar a Catálogo de Cursos en Business Panel',
          '2. Click en botón "Asignar" del curso deseado',
          '3. En el modal, seleccionar pestaña "Usuarios"',
          '4. Buscar y seleccionar usuarios con checkbox',
          '5. Click en "Siguiente" para configurar fechas',
          '6. Seleccionar fecha de inicio y fecha límite',
          '7. Opcionalmente usar "Sugerir con IA" para fechas',
          '8. Click en "Asignar Curso" para confirmar'
        ],
        commonBreakpoints: [
          'Paso 4: Usuarios no aparecen en la lista',
          'Paso 6: Validación de fechas falla',
          'Paso 8: Error al guardar la asignación'
        ]
      },
      {
        name: 'Asignar curso a un equipo completo',
        steps: [
          '1. Navegar a Catálogo de Cursos en Business Panel',
          '2. Click en botón "Asignar" del curso deseado',
          '3. En el modal, seleccionar pestaña "Equipos"',
          '4. Seleccionar el equipo deseado',
          '5. Configurar fechas',
          '6. Confirmar asignación'
        ],
        commonBreakpoints: [
          'Paso 4: Equipos no cargan',
          'Paso 6: Error al asignar a todos los miembros'
        ]
      }
    ];
