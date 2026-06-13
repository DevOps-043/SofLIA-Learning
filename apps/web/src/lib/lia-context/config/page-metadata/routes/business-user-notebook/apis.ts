import type { ApiInfo } from '../../types';

export const businessUserNotebookApis: ApiInfo[] = [
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/notes',
    method: 'GET',
    description:
      'Obtiene los apuntes del usuario (resúmenes de lecciones y notas manuales) con paginación y filtro opcional por curso.',
    commonErrors: [
      '401 Unauthorized: usuario no autenticado',
      '403 Forbidden: el usuario no pertenece a esta organización',
    ],
  },
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/courses',
    method: 'GET',
    description: 'Lista los cursos que tienen apuntes asociados, para alimentar el filtro por curso.',
    commonErrors: [],
  },
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/notes/[noteId]',
    method: 'PUT',
    description: 'Actualiza el contenido de una nota manual del usuario.',
    commonErrors: ['400 Bad Request: contenido inválido', '404 Not Found: la nota no existe'],
  },
];
