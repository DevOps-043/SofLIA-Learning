import type { ApiInfo } from '../../types';

export const businessUserNotebookEditorApis: ApiInfo[] = [
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/notes/[noteId]',
    method: 'GET',
    description:
      'Carga el contenido completo del apunte (solo si pertenece al usuario y a su organización actual).',
    commonErrors: ['404 Not Found: el apunte no existe o no tienes acceso'],
  },
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/notes/[noteId]',
    method: 'PUT',
    description:
      'Guarda los cambios de título, contenido o etiquetas (autoguardado tras ~1.2s de inactividad o al pulsar Guardar).',
    commonErrors: ['404 Not Found: el apunte no existe o no tienes acceso'],
  },
  {
    endpoint: '/api/[orgSlug]/business-user/notebook/notes/[noteId]',
    method: 'DELETE',
    description: 'Elimina el apunte de forma permanente.',
    commonErrors: ['404 Not Found: el apunte no existe o no tienes acceso'],
  },
];
