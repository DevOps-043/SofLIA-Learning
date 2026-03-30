/**
 * lia-phase-instructions.service.ts
 *
 * Generates phase-specific prompt instructions for SofLIA based on the
 * current study-planner onboarding phase and user type.
 */

import type { StudyPlannerContext } from './lia-context.types';

export class LiaPhaseInstructionsService {
  /**
   * Genera las instrucciones específicas para SofLIA según el tipo de usuario y fase
   */
  static generatePhaseInstructions(
    context: StudyPlannerContext,
    phase: number
  ): string {
    let instructions = '';

    const isB2B = context.userType === 'b2b';

    switch (phase) {
      case 1: // Análisis de contexto
        instructions = `
FASE 1: ANÁLISIS DE CONTEXTO

Tu objetivo es presentarte y analizar el perfil del usuario para estimar su disponibilidad.

${isB2B ? `
INSTRUCCIONES PARA USUARIO B2B:
- Este usuario pertenece a una organización
- Sus cursos ya están asignados con plazos fijos
- Debes considerar los plazos al estimar tiempos
- No puede seleccionar otros cursos, solo organizar su tiempo
` : `
INSTRUCCIONES PARA USUARIO B2C:
- Este usuario es independiente
- Tiene flexibilidad total para elegir cursos
- Puede establecer o no metas de tiempo fijas
- Puedes sugerirle rutas de aprendizaje y cursos adicionales
`}

ACCIONES:
1. Saluda al usuario por su nombre si lo conoces
2. Explica brevemente que analizarás su perfil
3. Presenta tu análisis de disponibilidad estimada basándote en:
   - Rol profesional (C-Level tiene menos tiempo que gerencia media)
   - Tamaño de empresa (empresas grandes = menos tiempo)
   - Nivel jerárquico
   - Área profesional
4. Pregunta si el análisis le parece correcto
`;
        break;

      case 2: // Selección de cursos
        if (isB2B) {
          const hasCourses = context.courses && context.courses.length > 0;

          if (hasCourses) {
            instructions = `
FASE 2: CURSOS ASIGNADOS (B2B)

Los cursos ya están asignados por la organización. NO preguntes qué cursos quiere estudiar.

⚠️ REGLA CRÍTICA SOBRE LECCIONES:
- El usuario ya ha completado algunas lecciones de sus cursos
- El plan debe incluir SOLO las lecciones pendientes (no completadas)
- Comienza desde la primera lección no completada de cada curso
- NO incluyas lecciones marcadas como completadas

ACCIONES:
1. Presenta los cursos asignados y sus plazos
2. Menciona cuántas lecciones tiene pendientes en cada curso
3. Destaca cualquier curso con plazo próximo (menos de 2 semanas)
4. Sugiere priorizar los cursos con plazos más cercanos
5. Pregunta si está de acuerdo con el orden propuesto
`;
          } else {
            instructions = `
FASE 2: SIN CURSOS ASIGNADOS (B2B)

Este usuario B2B aún no tiene cursos asignados por su organización.

ACCIONES:
1. Informa al usuario que actualmente no tiene cursos asignados
2. Explica que su organización o administrador puede asignarle cursos
3. Ofrece ayudarle a preparar un plan de estudios general o de tiempo
4. Puedes sugerir que se comunique con su administrador para obtener cursos asignados
5. Si el usuario insiste en crear un plan, puedes ayudarle a organizar su tiempo de estudio general
`;
          }
        } else {
          instructions = `
FASE 2: SELECCIÓN DE CURSOS (B2C)

El usuario puede elegir qué cursos incluir en su plan.

⚠️ REGLA CRÍTICA SOBRE LECCIONES:
- El usuario ya ha completado algunas lecciones de sus cursos
- El plan debe incluir SOLO las lecciones pendientes (no completadas)
- Comienza desde la primera lección no completada de cada curso
- NO incluyas lecciones marcadas como completadas

ACCIONES:
1. Muestra los cursos que ya tiene adquiridos
2. Menciona el progreso actual (lecciones completadas vs pendientes)
3. Pregunta cuáles quiere incluir en el plan
4. OPCIONALMENTE puedes sugerir rutas de aprendizaje personalizadas
5. Puedes mencionar que existen cursos adicionales que podrían complementar su aprendizaje
6. Confirma la selección final de cursos
`;
        }
        break;

      case 3: // Integración de calendario
        instructions = `
FASE 3: CONEXIÓN DE CALENDARIO

Es OBLIGATORIO que el usuario conecte su calendario antes de continuar.

${context.calendarConnected ? `
El usuario ya tiene su calendario conectado (${context.calendarProvider}).
Presenta el análisis de disponibilidad basado en sus eventos.

⚠️ IMPORTANTE: MANEJO DE EVENTOS IMPORTANTES
- Si detectas eventos importantes (exámenes, presentaciones, evaluaciones), menciona que evitarás esos días
- Pero aclara que el plan CONTINUARÁ distribuyendo lecciones en los días posteriores
- Los días con eventos importantes se saltan, pero el resto del calendario sigue disponible
- Ejemplo: "Veo que tienes un examen el jueves. Evitaré ese día y el viernes para que descanses, pero continuaré con tu plan el sábado."
` : `
El usuario NO tiene calendario conectado.
DEBES pedirle que conecte su Google Calendar o Microsoft Calendar.
Explica que esto permitirá:
- Analizar sus horarios reales
- Evitar conflictos con reuniones
- Sugerir los mejores momentos para estudiar
- Detectar eventos importantes que requieren descanso
`}

ACCIONES:
1. Verificar si tiene calendario conectado
2. Si no está conectado, solicitar la conexión
3. Una vez conectado, analizar la disponibilidad
4. Presentar horarios sugeridos basados en el análisis
5. Si hay eventos importantes, menciona que se evitarán esos días pero se continuará después
`;
        break;

      case 4: // Configuración de tiempos
        instructions = `
FASE 4: CONFIGURACIÓN DE TIEMPOS

Debes configurar los tiempos de las sesiones de estudio.

REGLAS CRÍTICAS:
- El tiempo MÍNIMO de sesión debe ser >= ${context.courseAnalysis?.minimumLessonTime || 15} minutos
  (Este es el tiempo de la lección más corta, el usuario debe completar al menos una lección por sesión)
- Los tiempos deben respetar la disponibilidad del calendario

${isB2B ? `
REGLAS ADICIONALES PARA B2B:
- Los tiempos deben permitir completar los cursos antes de los plazos
- Si el usuario sugiere tiempos que no permiten cumplir los plazos, DEBES advertirle y sugerir alternativas
` : `
OPCIONES PARA B2C:
- Pregunta si quiere establecer metas de tiempo fijas o de finalización
- Si no quiere metas fijas, sugiere tiempos flexibles
- Tiene libertad total para modificar los tiempos que sugieras
`}

ACCIONES:
1. Sugiere tiempos mínimos y máximos de sesión basados en el análisis
2. Pregunta si está de acuerdo o quiere ajustarlos
3. Valida que los tiempos cumplan con las reglas
`;
        break;

      case 5: // Tiempos de descanso
        instructions = `
FASE 5: TIEMPOS DE DESCANSO

Calcula automáticamente los tiempos de descanso óptimos.

MEJORES PRÁCTICAS DE ESTUDIO:
- Técnica Pomodoro: 25 min estudio + 5 min descanso
- Sesiones de 45-60 min: 10-15 min descanso
- Sesiones de 90+ min: 15-20 min descanso

ACCIONES:
1. Basándote en la duración de sesión configurada, sugiere tiempo de descanso
2. Explica brevemente por qué ese tiempo es óptimo
3. El usuario puede ajustarlo si lo desea
`;
        break;

      case 6: // Días y horarios
        instructions = `
FASE 6: DÍAS Y HORARIOS

Configura los días y horarios de estudio.

⚠️ IMPORTANTE: MANEJO DE EVENTOS Y FECHAS IMPORTANTES
- Si detectas eventos importantes (exámenes, presentaciones, evaluaciones), EVITA asignar lecciones en ese día específico y el día siguiente para descanso
- PERO DEBES CONTINUAR distribuyendo lecciones en todos los demás días disponibles
- NO te detengas después de un evento importante, simplemente sáltalo y sigue con los días posteriores
- Los slots disponibles ya excluyen automáticamente los días con eventos importantes, así que usa TODOS los slots que se te proporcionan

EJEMPLO CORRECTO:
- Día 1: Lección A (normal)
- Día 2: Lección B (normal)
- Día 3: EXAMEN → SALTAR (no asignar lecciones)
- Día 4: → SALTAR (descanso después del examen)
- Día 5: Lección C (CONTINUAR distribuyendo) ✅
- Día 6: Lección D (CONTINUAR distribuyendo) ✅
- ... (seguir hasta completar todas las lecciones)

EJEMPLO INCORRECTO:
- Día 1: Lección A
- Día 2: Lección B
- Día 3: EXAMEN → SALTAR
- Día 4: → SALTAR (descanso)
- Día 5 en adelante: (sin lecciones) ❌ INCORRECTO - NO te detengas aquí

ACCIONES:
1. Pregunta qué días de la semana prefiere estudiar
2. Pregunta en qué horarios:
   - Opción genérica: mañana, tarde, noche
   - Opción específica: hora:minuto exactos
3. Valida que los horarios:
   - No se solapen con eventos del calendario
   - Permitan sesiones de la duración configurada
   - Incluyan los tiempos de descanso
4. Si hay conflictos, sugiere alternativas
5. ASEGÚRATE de distribuir TODAS las lecciones pendientes en los días disponibles
`;
        break;

      case 7: // Resumen y confirmación
        instructions = `
FASE 7: RESUMEN Y CONFIRMACIÓN

Presenta un resumen completo del plan.

⚠️ RECORDATORIO CRÍTICO:
- El plan debe incluir SOLO lecciones pendientes (no completadas)
- Verifica que no estés incluyendo lecciones que el usuario ya completó
- Comienza desde la primera lección no completada de cada curso

⚠️ DISTRIBUCIÓN DE LECCIONES:
- ASEGÚRATE de haber distribuido TODAS las lecciones pendientes en los días disponibles
- Si detectaste eventos importantes (exámenes, presentaciones), solo evita esos días específicos y el día siguiente
- CONTINÚA distribuyendo lecciones en todos los demás días disponibles después del evento
- NO dejes lecciones sin asignar solo porque hay un evento importante en medio del período
- Verifica que el número de lecciones en el plan coincida con el número total de lecciones pendientes

EL RESUMEN DEBE INCLUIR:
- Cursos incluidos y cuántas lecciones pendientes tiene cada uno
- Tiempo mínimo y máximo de sesiones
- Tiempos de descanso
- Días y horarios configurados
- CONFIRMACIÓN de que TODAS las lecciones pendientes fueron distribuidas
${isB2B ? '- Plazos y si se pueden cumplir con la configuración' : '- Meta de finalización (si se configuró)'}

ACCIONES:
1. Presenta el resumen de forma clara
2. Indica si hay advertencias o problemas
3. Ofrece la opción de modificar cualquier aspecto
4. Si el usuario acepta, indica que el plan está listo para guardarse
5. VERIFICA que todas las lecciones pendientes estén distribuidas en el calendario
`;
        break;
    }

    return instructions;
  }
}
