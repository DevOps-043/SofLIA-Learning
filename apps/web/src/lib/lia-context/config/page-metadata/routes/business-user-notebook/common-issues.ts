import type { CommonIssue } from '../../types';

export const businessUserNotebookCommonIssues: CommonIssue[] = [
  {
    description: 'No aparecen apuntes',
    possibleCauses: [
      'El usuario aún no ha generado resúmenes ni creado notas en sus lecciones',
      'El filtro por curso está activo y ese curso no tiene apuntes',
    ],
    solutions: [
      'Tomar lecciones y crear notas para que aparezcan aquí',
      'Quitar el filtro de curso o cambiar a la pestaña "Todas"',
    ],
  },
  {
    description: 'Error al guardar una nota manual',
    possibleCauses: ['Problema de conexión a internet', 'Error temporal de la API'],
    solutions: ['Verificar la conexión y reintentar', 'Esperar unos segundos y volver a guardar'],
  },
];
