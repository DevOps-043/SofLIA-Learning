import type { ComponentInfo } from '../../types';

export const businessUserNotebookComponents: ComponentInfo[] = [
  {
    name: 'Pestañas del libro de apuntes',
    path: 'apps/web/src/features/notebook/components/NotebookTabs.tsx',
    description:
      'Dos vistas: "Todas" (todos tus apuntes y resúmenes) y "Por curso" (apuntes agrupados por el curso al que pertenecen).',
    props: ['activeTab'],
    commonErrors: [],
  },
  {
    name: 'Filtro por curso',
    path: 'apps/web/src/features/notebook/components/NotebookCourseFilter.tsx',
    description:
      'Permite filtrar los apuntes por un curso específico cuando estás en la pestaña "Por curso".',
    props: ['courses', 'selectedCourseId'],
    commonErrors: [],
  },
  {
    name: 'Tarjeta de apunte',
    path: 'apps/web/src/features/notebook/components/NotebookNoteCard.tsx',
    description:
      'Tarjeta con la vista previa de cada apunte (resumen de lección o nota manual); al pulsarla se abre el detalle.',
    props: ['item'],
    commonErrors: [],
  },
  {
    name: 'Detalle de apunte (modal)',
    path: 'apps/web/src/features/notebook/components/NotebookNoteModal.tsx',
    description:
      'Ventana para leer el apunte completo y, en el caso de las notas manuales, editarlas y guardarlas.',
    props: ['state', 'isSavingNote'],
    commonErrors: ['Error al guardar: fallo de red o de la API al actualizar la nota'],
  },
];
