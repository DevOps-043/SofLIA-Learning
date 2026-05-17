import type { UserFlow } from '../../types';

export const studyPlannerDashboardUserFlows: UserFlow[] = [
      {
        name: 'Crear un plan de estudio nuevo',
        steps: [
          '1. Abrir el Study Planner',
          '2. Iniciar conversación con SofLIA',
          '3. Indicar preferencias de estudio (días, horarios)',
          '4. SofLIA genera un plan personalizado',
          '5. Revisar y ajustar el plan',
          '6. Confirmar y guardar el plan'
        ],
        commonBreakpoints: [
          'Paso 3: SofLIA no entiende preferencias',
          'Paso 4: Plan generado no es adecuado',
          'Paso 6: Error al guardar'
        ]
      },
      {
        name: 'Conectar calendario externo',
        steps: [
          '1. Click en "Conectar Calendario"',
          '2. Seleccionar proveedor (Google, Microsoft)',
          '3. Autorizar acceso en ventana de OAuth',
          '4. Calendario conectado y sincronizado'
        ],
        commonBreakpoints: [
          'Paso 3: OAuth falla o se cierra',
          'Paso 4: Eventos no aparecen'
        ]
      },
      {
        name: 'Modificar plan existente',
        steps: [
          '1. Abrir plan actual',
          '2. Hablar con SofLIA para ajustar',
          '3. Confirmar cambios',
          '4. Plan actualizado'
        ],
        commonBreakpoints: [
          'Paso 2: SofLIA no actualiza el plan',
          'Paso 3: Error al guardar cambios'
        ]
      }
    ];
