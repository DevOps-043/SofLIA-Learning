import type { UserFlow } from '../../types';

export const businessUserNotebookEditorUserFlows: UserFlow[] = [
  {
    name: 'Editar y dar formato a un apunte',
    steps: [
      '1. Escribir o modificar el contenido en la hoja',
      '2. Usar la barra de herramientas para dar formato (negrita, color, listas, etc.)',
      '3. Los cambios se guardan automáticamente; el header muestra "Guardado"',
    ],
    commonBreakpoints: [
      'Paso 3: si aparece "Error", revisa la conexión y pulsa "Guardar"',
    ],
  },
  {
    name: 'Cambiar el título o las etiquetas',
    steps: [
      '1. Editar el campo de título arriba de la hoja',
      '2. Agregar o quitar etiquetas en el panel lateral "Etiquetas"',
      '3. Se guarda automáticamente',
    ],
    commonBreakpoints: [],
  },
  {
    name: 'Eliminar el apunte',
    steps: [
      '1. Pulsar "Eliminar" en el panel de acciones',
      '2. Confirmar en el aviso "¿Eliminar este apunte?"',
      '3. Regresa al libro de apuntes',
    ],
    commonBreakpoints: ['Paso 2: la eliminación es permanente'],
  },
  {
    name: 'Volver al libro de apuntes',
    steps: ['1. Pulsar "Volver" en el header para regresar al listado'],
    commonBreakpoints: [],
  },
];
