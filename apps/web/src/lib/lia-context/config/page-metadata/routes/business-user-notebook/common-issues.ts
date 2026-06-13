import type { CommonIssue } from '../../types';

export const businessUserNotebookCommonIssues: CommonIssue[] = [
  {
    description: 'No aparecen apuntes en el libro',
    possibleCauses: [
      'Aún no has creado apuntes en esta organización',
      'Los apuntes pertenecen a otra organización en la que también participas',
    ],
    solutions: [
      'Crear un apunte nuevo o tomar notas desde una lección',
      'Verificar que estás en la organización correcta (los apuntes no se comparten entre organizaciones)',
    ],
  },
  {
    description: 'No puedo crear un apunte nuevo',
    possibleCauses: [
      'No estás inscrito en ningún curso con lecciones disponibles',
      'No tienes acceso al curso seleccionado en esta organización',
    ],
    solutions: [
      'Confirmar que tienes cursos asignados con lecciones publicadas',
      'Seleccionar un curso al que tengas acceso en tu organización',
    ],
  },
  {
    description: 'Mis cambios no se guardan',
    possibleCauses: [
      'Conexión inestable durante el autoguardado',
      'La sesión expiró',
    ],
    solutions: [
      'Pulsar "Guardar" manualmente y revisar el indicador de estado',
      'Recargar la página e iniciar sesión nuevamente si es necesario',
    ],
  },
];
