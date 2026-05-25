import type { CommonIssue } from '../../types';

export const instructorNewCourseCommonIssues: CommonIssue[] = [
      {
        description: 'Video no sube',
        possibleCauses: ['Archivo muy grande', 'Formato no soportado', 'Conexión lenta'],
        solutions: ['Comprimir video', 'Usar MP4', 'Intentar con mejor conexión']
      }
    ];
