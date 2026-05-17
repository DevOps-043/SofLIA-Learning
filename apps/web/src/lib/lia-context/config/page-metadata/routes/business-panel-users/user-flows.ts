import type { UserFlow } from '../../types';

export const businessPanelUsersUserFlows: UserFlow[] = [
      {
        name: 'Agregar usuario individual',
        steps: [
          '1. Click en botón "Agregar Usuario"',
          '2. Completar formulario con email, nombre, apellido',
          '3. Seleccionar rol y equipo (opcional)',
          '4. Click en "Agregar" para enviar invitación'
        ],
        commonBreakpoints: [
          'Paso 2: Validación de email falla',
          'Paso 4: Error al enviar invitación'
        ]
      },
      {
        name: 'Importar usuarios masivamente',
        steps: [
          '1. Click en botón "Importar CSV"',
          '2. Descargar plantilla CSV de ejemplo',
          '3. Completar CSV con datos de usuarios',
          '4. Subir archivo CSV',
          '5. Revisar y confirmar importación'
        ],
        commonBreakpoints: [
          'Paso 4: Archivo no es CSV válido',
          'Paso 5: Errores de validación en datos'
        ]
      },
      {
        name: 'Ver estadísticas de usuario',
        steps: [
          '1. Buscar usuario en la tabla',
          '2. Click en icono de estadísticas o nombre del usuario',
          '3. Revisar métricas en el modal'
        ],
        commonBreakpoints: [
          'Paso 2: Modal no abre',
          'Paso 3: Datos no cargan'
        ]
      }
    ];
