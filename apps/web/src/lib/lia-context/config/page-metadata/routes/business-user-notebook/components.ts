import type { ComponentInfo } from '../../types';

export const businessUserNotebookComponents: ComponentInfo[] = [
  {
    name: 'Árbol de cursos y lecciones',
    path: 'apps/web/src/features/notebook/components/NotebookTree.tsx',
    description:
      'Barra lateral que organiza tus apuntes por curso y, dentro de cada curso, por lección. Permite filtrar las notas mostradas.',
    props: ['tree', 'selection', 'onSelect'],
    commonErrors: ['Árbol vacío: aún no has creado apuntes en esta organización'],
  },
  {
    name: 'Tarjeta de apunte',
    path: 'apps/web/src/features/notebook/components/NotebookNoteCard.tsx',
    description:
      'Tarjeta con el título, curso, lección y etiquetas del apunte. Al pasar el cursor muestra una vista previa flotante; al hacer clic abre el editor.',
    props: ['item', 'onOpen'],
    commonErrors: [],
  },
  {
    name: 'Vista previa flotante',
    path: 'apps/web/src/features/notebook/components/NoteHoverPreview.tsx',
    description:
      'Ventana pequeña de solo lectura que muestra el contenido del apunte al pasar el cursor sobre su tarjeta.',
    props: ['title', 'content'],
    commonErrors: [],
  },
  {
    name: 'Editor de texto enriquecido',
    path: 'apps/web/src/features/notebook/components/editor/RichTextEditor.tsx',
    description:
      'Editor tipo Word (TipTap) para escribir y dar formato a los apuntes: negrita, cursiva, subrayado, encabezados, listas, citas, enlaces y alineación. Guarda automáticamente.',
    props: ['value', 'onChange'],
    commonErrors: ['Cambios no guardados: revisa el indicador de estado de guardado'],
  },
  {
    name: 'Crear nuevo apunte',
    path: 'apps/web/src/features/notebook/components/NewNoteModal.tsx',
    description:
      'Modal para crear un apunte eligiendo el curso y la lección a la que pertenece.',
    props: ['orgSlug', 'onCreated'],
    commonErrors: ['Sin cursos: no tienes cursos con lecciones disponibles'],
  },
];
