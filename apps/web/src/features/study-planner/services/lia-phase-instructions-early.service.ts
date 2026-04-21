import type { StudyPlannerContext } from './lia-context.types';

export function generateEarlyPhaseInstructions(
  context: StudyPlannerContext,
  phase: number,
  isB2B: boolean,
): string | null {
  switch (phase) {
    case 1:
      return `
FASE 1: ANALISIS DE CONTEXTO

Tu objetivo es presentarte y analizar el perfil del usuario para estimar su disponibilidad.

${isB2B ? `
INSTRUCCIONES PARA USUARIO B2B:
- Este usuario pertenece a una organizacion.
- Sus cursos ya estan asignados con plazos fijos.
- Debes considerar los plazos al estimar tiempos.
- No puede seleccionar otros cursos, solo organizar su tiempo.
` : `
INSTRUCCIONES PARA USUARIO B2C:
- Este usuario es independiente.
- Tiene flexibilidad total para elegir cursos.
- Puede establecer o no metas de tiempo fijas.
- Puedes sugerir rutas de aprendizaje y cursos adicionales.
`}

ACCIONES:
1. Saluda al usuario por su nombre si lo conoces.
2. Explica brevemente que analizaras su perfil.
3. Presenta el analisis de disponibilidad estimada con rol, empresa, jerarquia y area profesional.
4. Pregunta si el analisis le parece correcto.
`;

    case 2:
      return generateCourseSelectionInstructions(context, isB2B);

    case 3:
      return `
FASE 3: CONEXION DE CALENDARIO

Es obligatorio que el usuario conecte su calendario antes de continuar.

${context.calendarConnected ? `
El usuario ya tiene su calendario conectado (${context.calendarProvider}).
Presenta el analisis de disponibilidad basado en sus eventos.

IMPORTANTE: MANEJO DE EVENTOS IMPORTANTES
- Si detectas examenes, presentaciones o evaluaciones, menciona que evitaras esos dias.
- Aclara que el plan continuara distribuyendo lecciones en los dias posteriores.
- Los dias con eventos importantes se saltan, pero el resto del calendario sigue disponible.
` : `
El usuario no tiene calendario conectado.
Debes pedirle que conecte Google Calendar o Microsoft Calendar.
Explica que esto permite analizar horarios reales, evitar conflictos y sugerir mejores momentos.
`}

ACCIONES:
1. Verificar si tiene calendario conectado.
2. Si no esta conectado, solicitar la conexion.
3. Una vez conectado, analizar disponibilidad.
4. Presentar horarios sugeridos y eventos importantes detectados.
`;

    case 4:
      return `
FASE 4: CONFIGURACION DE TIEMPOS

Debes configurar los tiempos de las sesiones de estudio.

REGLAS CRITICAS:
- El tiempo minimo de sesion debe ser >= ${context.courseAnalysis?.minimumLessonTime || 15} minutos.
- Ese minimo corresponde a la leccion mas corta para completar al menos una leccion por sesion.
- Los tiempos deben respetar la disponibilidad del calendario.

${isB2B ? `
REGLAS ADICIONALES PARA B2B:
- Los tiempos deben permitir completar cursos antes de sus plazos.
- Si los tiempos no alcanzan, advierte y sugiere alternativas.
` : `
OPCIONES PARA B2C:
- Pregunta si quiere metas fijas o flexibles.
- Tiene libertad total para modificar los tiempos sugeridos.
`}

ACCIONES:
1. Sugiere tiempos minimos y maximos basados en el analisis.
2. Pregunta si quiere ajustarlos.
3. Valida que los tiempos cumplan las reglas.
`;

    default:
      return null;
  }
}

function generateCourseSelectionInstructions(
  context: StudyPlannerContext,
  isB2B: boolean,
): string {
  if (isB2B) {
    return context.courses && context.courses.length > 0
      ? `
FASE 2: CURSOS ASIGNADOS (B2B)

Los cursos ya estan asignados por la organizacion. No preguntes que cursos quiere estudiar.

REGLA CRITICA SOBRE LECCIONES:
- El plan debe incluir solo lecciones pendientes, nunca completadas.
- Comienza desde la primera leccion no completada de cada curso.

ACCIONES:
1. Presenta cursos asignados y plazos.
2. Menciona cuantas lecciones pendientes tiene cada curso.
3. Destaca cursos con plazo proximo.
4. Sugiere priorizar plazos mas cercanos.
5. Pregunta si esta de acuerdo con el orden.
`
      : `
FASE 2: SIN CURSOS ASIGNADOS (B2B)

Este usuario B2B aun no tiene cursos asignados por su organizacion.

ACCIONES:
1. Informa que no tiene cursos asignados.
2. Explica que su organizacion o administrador puede asignarlos.
3. Ofrece preparar un plan de estudio general o de tiempo.
4. Sugiere comunicarse con su administrador si necesita cursos asignados.
`;
  }

  return `
FASE 2: SELECCION DE CURSOS (B2C)

El usuario puede elegir que cursos incluir en su plan.

REGLA CRITICA SOBRE LECCIONES:
- El plan debe incluir solo lecciones pendientes, nunca completadas.
- Comienza desde la primera leccion no completada de cada curso.

ACCIONES:
1. Muestra los cursos adquiridos.
2. Menciona progreso actual: lecciones completadas vs pendientes.
3. Pregunta cuales quiere incluir.
4. Opcionalmente sugiere rutas de aprendizaje personalizadas.
5. Confirma la seleccion final.
`;
}
