import type { CommonIssue } from '../../types';

export const businessUserNotebookEditorCommonIssues: CommonIssue[] = [
  {
    description: 'El apunte tarda en cargar',
    possibleCauses: [
      'Primera carga del editor (incluye el componente de edición enriquecida)',
      'Conexión lenta',
    ],
    solutions: [
      'Esperar unos segundos; las siguientes aperturas son casi instantáneas (quedan en caché)',
      'Revisar la conexión a internet',
    ],
  },
  {
    description: 'Los cambios no se guardan',
    possibleCauses: [
      'Conexión inestable durante el autoguardado',
      'La sesión expiró',
    ],
    solutions: [
      'Pulsar "Guardar" y revisar el indicador de estado en el header',
      'Recargar e iniciar sesión nuevamente si es necesario',
    ],
  },
  {
    description: 'No encuentro el apunte / acceso denegado',
    possibleCauses: [
      'El apunte pertenece a otra organización en la que también participas',
      'El apunte fue eliminado',
    ],
    solutions: [
      'Verificar que estás en la organización correcta (los apuntes no se comparten entre organizaciones)',
      'Volver al libro de apuntes y abrir un apunte existente',
    ],
  },
];
