import type { ComponentInfo } from '../../types';

export const businessUserNotebookEditorComponents: ComponentInfo[] = [
  {
    name: 'Editor de texto enriquecido',
    path: 'apps/web/src/features/notebook/components/editor/RichTextEditor.tsx',
    description:
      'Editor tipo Word (TipTap) con barra de herramientas: negrita, cursiva, subrayado, tachado, subíndice/superíndice, fuente, tamaño, interlineado, color de letra, resaltado, encabezados, listas (viñetas, numerada, tareas), cita, código, línea horizontal, alineación, enlaces, limpiar formato y deshacer/rehacer. Guarda automáticamente.',
    props: ['value', 'onChange'],
    commonErrors: [
      'Cambios no guardados: revisa el indicador "Guardando/Guardado/Error" en el header',
    ],
  },
  {
    name: 'Título del apunte',
    path: 'apps/web/src/features/notebook/components/NoteEditorPageClient.tsx',
    description:
      'Campo de título editable en la parte superior de la hoja; se guarda automáticamente junto con el contenido.',
    props: [],
    commonErrors: [],
  },
  {
    name: 'Etiquetas',
    path: 'apps/web/src/features/notebook/components/TagInput.tsx',
    description:
      'Permite agregar y quitar etiquetas del apunte (Enter para agregar, X para quitar).',
    props: ['tags', 'onChange'],
    commonErrors: [],
  },
  {
    name: 'Acciones (Guardar / Eliminar)',
    path: 'apps/web/src/features/notebook/components/NoteEditorPageClient.tsx',
    description:
      'Panel lateral con guardado manual y eliminación del apunte (con confirmación en línea), además de la ubicación (curso y lección) del apunte.',
    props: [],
    commonErrors: ['Eliminar es permanente y no se puede deshacer'],
  },
];
