import type { UserFlow } from '../../types';

export const businessUserNotebookUserFlows: UserFlow[] = [
  {
    name: 'Explorar apuntes por curso y lección',
    steps: [
      '1. Abrir el árbol lateral de cursos',
      '2. Expandir un curso para ver sus lecciones',
      '3. Seleccionar una lección para ver solo sus apuntes',
    ],
    commonBreakpoints: ['Paso 1: el árbol está vacío si aún no creaste apuntes'],
  },
  {
    name: 'Previsualizar un apunte sin abrirlo',
    steps: [
      '1. Pasar el cursor sobre la tarjeta de un apunte',
      '2. Leer su contenido en la ventana flotante de vista previa',
    ],
    commonBreakpoints: [],
  },
  {
    name: 'Editar un apunte en su página completa',
    steps: [
      '1. Hacer clic en la tarjeta del apunte',
      '2. Editar título, contenido (editor enriquecido) y etiquetas',
      '3. Los cambios se guardan automáticamente',
    ],
    commonBreakpoints: ['Paso 3: revisa el indicador de estado si el guardado falla'],
  },
  {
    name: 'Crear un nuevo apunte',
    steps: [
      '1. Pulsar "Nuevo apunte"',
      '2. Elegir el curso y la lección',
      '3. Crear y empezar a escribir en el editor',
    ],
    commonBreakpoints: ['Paso 2: necesitas estar inscrito en al menos un curso con lecciones'],
  },
  {
    name: 'Buscar apuntes',
    steps: [
      '1. Escribir en el buscador (título, curso, lección o etiqueta)',
      '2. Revisar los resultados filtrados',
    ],
    commonBreakpoints: [],
  },
];
