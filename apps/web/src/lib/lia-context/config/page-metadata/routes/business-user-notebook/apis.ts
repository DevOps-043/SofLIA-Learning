import type { ApiInfo } from '../../types';

export const businessUserNotebookApis: ApiInfo[] = [
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/tree',
    method: 'GET',
    description:
      'Devuelve los apuntes del usuario organizados por curso y lección, limitados a su organización actual.',
    commonErrors: [
      '401 Unauthorized: usuario no autenticado',
      '403 Forbidden: el usuario no pertenece a esta organización',
    ],
  },
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/courses',
    method: 'GET',
    description:
      'Lista los cursos asignados al usuario en la organización (asignación directa o por ruta de aprendizaje) con sus lecciones, para crear nuevos apuntes.',
    commonErrors: ['403 Forbidden: el usuario no pertenece a esta organización'],
  },
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/notes',
    method: 'POST',
    description:
      'Crea un apunte asociado a una lección dentro de la organización del usuario.',
    commonErrors: [
      '403 Forbidden: el usuario no tiene acceso al curso en su organización',
      '422 Unprocessable Entity: datos del apunte inválidos',
    ],
  },
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/notes/[noteId]',
    method: 'GET',
    description:
      'Obtiene el contenido completo de un apunte (solo si pertenece al usuario y a su organización).',
    commonErrors: ['404 Not Found: el apunte no existe o no tienes acceso'],
  },
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/notes/[noteId]',
    method: 'PUT',
    description:
      'Actualiza el título, contenido o etiquetas de un apunte del usuario en su organización.',
    commonErrors: ['404 Not Found: el apunte no existe o no tienes acceso'],
  },
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/notes/[noteId]',
    method: 'DELETE',
    description: 'Elimina un apunte del usuario en su organización.',
    commonErrors: ['404 Not Found: el apunte no existe o no tienes acceso'],
  },
];
