import type { UserFlow } from '../../types';

export const businessUserNotebookUserFlows: UserFlow[] = [
  {
    name: 'Consultar tus apuntes y resúmenes de las lecciones',
    steps: [
      '1. Abrir el libro de apuntes',
      '2. Revisar las tarjetas con tus apuntes en la pestaña "Todas"',
      '3. Pulsar una tarjeta para leer el apunte completo',
    ],
    commonBreakpoints: ['Paso 2: si aún no tienes apuntes verás el estado vacío'],
  },
  {
    name: 'Filtrar tus apuntes por curso',
    steps: [
      '1. Cambiar a la pestaña "Por curso"',
      '2. Seleccionar el curso en el filtro',
      '3. Ver solo los apuntes de ese curso',
    ],
    commonBreakpoints: [],
  },
  {
    name: 'Leer y editar una nota manual',
    steps: [
      '1. Pulsar la tarjeta de una nota manual',
      '2. En el detalle, activar el modo edición',
      '3. Modificar el contenido y guardar',
    ],
    commonBreakpoints: ['Paso 3: error al guardar por fallo de red o de la API'],
  },
  {
    name: 'Cargar más apuntes',
    steps: ['1. Bajar al final de la lista', '2. Pulsar "Cargar más" para ver más apuntes'],
    commonBreakpoints: [],
  },
];
