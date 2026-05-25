import type { UserFlow } from '../../types';

export const courseLearnUserFlows: UserFlow[] = [
      {
        name: 'Ver una lección completa',
        steps: [
          '1. Iniciar reproducción del video',
          '2. Ver el video hasta el final',
          '3. El progreso se guarda automáticamente',
          '4. Lección se marca como completada'
        ],
        commonBreakpoints: [
          'Paso 1: Video no inicia',
          'Paso 3: Progreso no se guarda',
          'Paso 4: Lección no se marca como completada'
        ]
      },
      {
        name: 'Completar actividad interactiva',
        steps: [
          '1. Llegar a la actividad en el panel derecho',
          '2. Leer instrucciones de la actividad',
          '3. Completar la actividad (quiz, reflexión, etc.)',
          '4. Enviar respuesta',
          '5. Ver feedback de SofLIA'
        ],
        commonBreakpoints: [
          'Paso 3: Campos no validan',
          'Paso 4: Error al enviar',
          'Paso 5: Feedback no aparece'
        ]
      },
      {
        name: 'Pedir ayuda a SofLIA sobre el contenido',
        steps: [
          '1. Abrir panel de SofLIA',
          '2. Escribir pregunta sobre el contenido',
          '3. SofLIA responde con contexto del video',
          '4. Continuar conversación si es necesario'
        ],
        commonBreakpoints: [
          'Paso 2: Input no funciona',
          'Paso 3: SofLIA no responde o da error'
        ]
      }
    ];
