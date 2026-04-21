export function generateLatePhaseInstructions(
  phase: number,
  isB2B: boolean,
): string | null {
  switch (phase) {
    case 5:
      return `
FASE 5: TIEMPOS DE DESCANSO

Calcula automaticamente los tiempos de descanso optimos.

MEJORES PRACTICAS DE ESTUDIO:
- Tecnica Pomodoro: 25 min estudio + 5 min descanso.
- Sesiones de 45-60 min: 10-15 min descanso.
- Sesiones de 90+ min: 15-20 min descanso.

ACCIONES:
1. Sugiere tiempo de descanso segun la duracion configurada.
2. Explica brevemente por que ese tiempo es optimo.
3. Permite que el usuario lo ajuste.
`;

    case 6:
      return `
FASE 6: DIAS Y HORARIOS

Configura los dias y horarios de estudio.

IMPORTANTE: MANEJO DE EVENTOS Y FECHAS IMPORTANTES
- Si detectas examenes, presentaciones o evaluaciones, evita asignar lecciones ese dia y el dia siguiente.
- Debes continuar distribuyendo lecciones en todos los demas dias disponibles.
- No te detengas despues de un evento importante; saltalo y sigue con los dias posteriores.
- Los slots disponibles ya excluyen eventos importantes, asi que usa todos los slots proporcionados.

EJEMPLO CORRECTO:
- Dia 1: Leccion A.
- Dia 2: Leccion B.
- Dia 3: EXAMEN, saltar.
- Dia 4: descanso posterior.
- Dia 5: Leccion C, continuar distribuyendo.

EJEMPLO INCORRECTO:
- Asignar lecciones hasta el examen y dejar vacios los dias posteriores.

ACCIONES:
1. Pregunta que dias de la semana prefiere estudiar.
2. Pregunta horarios generales o exactos.
3. Valida que no se solapen con calendario y permitan descansos.
4. Si hay conflictos, sugiere alternativas.
5. Asegurate de distribuir todas las lecciones pendientes.
`;

    case 7:
      return `
FASE 7: RESUMEN Y CONFIRMACION

Presenta un resumen completo del plan.

RECORDATORIO CRITICO:
- El plan debe incluir solo lecciones pendientes.
- Verifica que no incluyas lecciones completadas.
- Comienza desde la primera leccion no completada de cada curso.

DISTRIBUCION DE LECCIONES:
- Asegurate de distribuir todas las lecciones pendientes en dias disponibles.
- Si hubo eventos importantes, evita solo esos dias y el dia siguiente.
- Continua distribuyendo en los demas dias posteriores.
- No dejes lecciones sin asignar por un evento intermedio.
- Verifica que el numero de lecciones planificadas coincida con las pendientes.

EL RESUMEN DEBE INCLUIR:
- Cursos incluidos y lecciones pendientes por curso.
- Tiempo minimo y maximo de sesiones.
- Tiempos de descanso.
- Dias y horarios configurados.
- Confirmacion de cobertura completa de lecciones pendientes.
${isB2B ? '- Plazos y si se pueden cumplir con la configuracion.' : '- Meta de finalizacion si se configuro.'}

ACCIONES:
1. Presenta el resumen de forma clara.
2. Indica advertencias o problemas.
3. Ofrece modificar cualquier aspecto.
4. Si el usuario acepta, indica que el plan esta listo para guardarse.
5. Verifica que todas las lecciones pendientes esten distribuidas.
`;

    default:
      return null;
  }
}
