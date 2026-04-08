# Plan de Remediacion del Study Planner

## Objetivo

Definir la forma mas viable de corregir el problema recurrente de cambios sobre planes ya generados, tomando `prompt_maestro.md` como fuente de verdad arquitectonica y minimizando deuda tecnica.

La meta no es solo "que inserte eventos", sino que el sistema:

1. interprete correctamente la intencion del usuario,
2. calcule cambios validos sobre el plan,
3. persista esos cambios de forma deterministica,
4. sincronice el calendario sin duplicados ni corrupcion,
5. pueda probarse y auditarse.

## Fuente de verdad aplicada

De `prompt_maestro.md` se desprenden cuatro principios que aqui son obligatorios:

1. separar responsabilidades,
2. no incrustar logica de negocio en UI o handlers,
3. explicitar contratos e idempotencia en operaciones criticas,
4. priorizar correctitud, mantenibilidad y testabilidad sobre atajos.

Eso implica que la IA no debe escribir directo sobre calendario ni mutar sesiones "sobre la marcha" sin una capa intermedia verificable.

## Diagnostico del estado actual

### Hallazgos tecnicos en el codigo

1. El cambio de horario depende de parsing por regex en `apps/web/src/features/study-planner/services/plan-adjustment.service.ts`.
2. La decision de si el usuario quiere "agregar", "cambiar", "confirmar" o "guardar" depende de heuristicas textuales en `apps/web/src/features/study-planner/services/planner-message-intent.service.ts`.
3. El hook `apps/web/src/features/study-planner/hooks/usePlanScheduleAdjuster.ts` mezcla interpretacion de lenguaje, mutacion de estado local, mensajes UI y persistencia.
4. El cambio de fecha en `usePlanScheduleAdjuster.ts` solo modifica `savedLessonDistribution` en memoria y no persiste ni sincroniza con calendario.
5. El cambio de hora si intenta persistirse, pero construye updates por posicion del arreglo en `apps/web/src/features/study-planner/hooks/planner-message-handler.utils.ts` con `getChangedSessionUpdates()`.
6. La actualizacion backend busca sesiones por `dateStr + originalStartTime` o por `sessionId`, pero el payload actual no siempre transporta `sessionId`. La resolucion cae en matching heuristico en `apps/web/src/app/api/study-planner/sessions/update/study-planner-session-update.utils.ts`.
7. La sincronizacion de calendario crea eventos y guarda `external_event_id`, pero el flujo de ajuste no garantiza una estrategia uniforme de `create/update/delete` sobre esos eventos.
8. El rebalanceo y otras acciones del dashboard en `apps/web/src/app/api/study-planner/dashboard/chat/actions/planning-actions.service.ts` siguen una logica separada, con offsets fijos y reglas diferentes al flujo principal.

### Sintomas explicados por la implementacion actual

Los problemas reportados encajan casi exactamente con la arquitectura vigente:

1. "Todo lo inserta en un mismo dia":
   la resolucion de cambios no parte de entidades estables sino de texto y arreglos mutables; si se pierde referencia, el sistema termina recalculando o actualizando contra una coincidencia incorrecta.
2. "Inserta repetidamente sobre un mismo punto":
   falta idempotencia de operaciones y falta una capa de diff declarativo antes de sincronizar.
3. "Formato inadecuado, solo Sesion de estudio":
   el titulo depende de `buildSessionTitle()` en `apps/web/src/features/study-planner/services/study-plan-persistence.service.ts`, pero los cambios posteriores no preservan un contrato fuerte entre sesion, leccion y titulo.
4. "No hace los cambios":
   el cambio de fecha no persiste; el de hora puede fallar si el matching por hora no encuentra la sesion correcta.

## Causa raiz

El problema principal no parece estar en la generacion inicial del plan, sino en que el sistema no tiene un modelo deterministico de "operaciones de cambio".

Hoy el flujo real es aproximadamente este:

1. usuario escribe lenguaje natural,
2. regex/heuristicas intentan deducir intencion,
3. se muta una distribucion en memoria,
4. a veces se traducen diferencias a updates,
5. luego se intenta sincronizar con BD y calendario.

Ese flujo falla porque faltan tres capas explicitas:

1. una capa de interpretacion estructurada de cambios,
2. una capa de plan diff / plan patch con ids estables,
3. una capa de sincronizacion idempotente con calendario.

## Decision recomendada

### Recomendacion principal

Adoptar un modelo hibrido:

1. IA solo para interpretar la intencion del usuario y producir una propuesta estructurada,
2. algoritmo deterministico para aplicar los cambios sobre sesiones y lecciones,
3. sincronizacion de calendario mediante operaciones explicitas `create/update/delete/noop`.

### Recomendacion secundaria

No usar la IA para insertar directamente en calendario ni para decidir por si sola donde escribir cada cambio final.

### Por que esta es la opcion mas viable

Porque:

1. conserva el valor conversacional actual,
2. elimina el punto mas fragil, que es permitir que texto libre gobierne escrituras finales,
3. reduce deuda tecnica al centralizar reglas,
4. hace posible probar cambios complejos con fixtures y regresion automatizada,
5. evita que distintos flujos del producto recalculen sesiones con reglas incompatibles.

## Alternativas evaluadas

### Opcion A. Seguir con IA end-to-end y mejorar prompts

No recomendada como solucion principal.

Ventajas:

1. menor esfuerzo inicial,
2. poco cambio en arquitectura.

Desventajas:

1. no resuelve idempotencia,
2. sigue siendo fragil ante ambiguedad,
3. complica debugging,
4. eleva deuda tecnica porque el comportamiento queda distribuido entre prompts, hooks y handlers.

### Opcion B. Algoritmo 100 por ciento deterministico sin IA

Viable, pero no ideal como primer paso.

Ventajas:

1. maxima previsibilidad,
2. mejor auditabilidad.

Desventajas:

1. empeora UX conversacional,
2. requiere un parser manual mucho mas grande para cubrir lenguaje natural real,
3. obliga a reimplementar muchas intenciones que hoy ya resuelve la IA.

### Opcion C. Hibrido IA + patch deterministico

Recomendada.

La IA produce una estructura como:

```json
{
  "intent": "move_sessions",
  "scope": {
    "planId": "plan_123",
    "sessionIds": ["sess_1", "sess_2"]
  },
  "operations": [
    {
      "type": "move",
      "sessionId": "sess_1",
      "newStart": "2026-04-15T19:00:00-06:00",
      "newEnd": "2026-04-15T20:00:00-06:00"
    }
  ],
  "reasoningSummary": "Usuario pidio mover la sesion del martes al miercoles a la misma hora"
}
```

Luego un motor interno valida y aplica.

## Arquitectura objetivo

### 1. Intent Parser

Responsabilidad:

1. convertir lenguaje natural a intencion estructurada,
2. pedir confirmacion si hay ambiguedad,
3. no tocar BD ni calendario.

Salida propuesta:

1. `change_request`,
2. `ambiguities`,
3. `confidence`,
4. `human_summary`.

### 2. Plan Change Engine

Responsabilidad:

1. recibir `change_request`,
2. resolver sesiones objetivo usando ids estables,
3. generar `plan_patch`,
4. validar restricciones.

Tipos de operacion sugeridos:

1. `move_session`,
2. `resize_session`,
3. `split_session`,
4. `merge_sessions`,
5. `add_session`,
6. `delete_session`,
7. `rebalance_range`.

### 3. Constraint Validator

Debe validar como minimo:

1. no overlap con otras sesiones del plan,
2. no overlap con busy slots del calendario,
3. no violar fecha objetivo o deadlines B2B,
4. no exceder maximo de sesiones por dia,
5. no perder lecciones ni duplicarlas,
6. preservar trazabilidad `session -> lesson(s) -> course`.

### 4. Persistence Layer

Debe aplicar el patch dentro de una operacion transaccional sobre BD:

1. leer estado actual,
2. aplicar cambios,
3. guardar auditoria del cambio,
4. devolver estado final canonical.

### 5. Calendar Sync Reconciler

Debe traducir el patch persistido a operaciones de calendario:

1. `create`,
2. `update`,
3. `delete`,
4. `noop`.

Cada operacion debe ser idempotente y basada en `sessionId` + `external_event_id`.

## Modelo de datos recomendado

### Cambios minimos necesarios

1. Toda sesion editable debe tener `id` estable en frontend y backend.
2. La distribucion mostrada en UI debe transportar `sessionId` cuando exista.
3. Debe existir una tabla de auditoria de cambios, por ejemplo `study_plan_change_log`.
4. Debe existir un campo de version por plan, por ejemplo `study_plans.version`.
5. Debe existir un identificador de sincronizacion por sesion, por ejemplo `sync_fingerprint` o `calendar_sync_version`.

### Estructura sugerida de auditoria

```sql
study_plan_change_log
- id
- plan_id
- user_id
- source ("chat", "manual", "system")
- request_payload
- computed_patch
- applied_patch
- status
- created_at
```

## Algoritmo recomendado para cambios

### Enfoque base

No recalcular todo el plan salvo que el cambio lo exija.

Estrategia:

1. cambios puntuales:
   aplicar patch local sobre sesiones objetivo,
2. cambios medianos:
   recalcular solo una ventana afectada,
3. cambios grandes:
   regenerar un segmento definido del plan, no el plan completo.

### Niveles de cambio

#### Nivel 1. Operacion puntual

Ejemplos:

1. mover una sesion,
2. cambiar una hora,
3. cambiar duracion,
4. borrar una sesion,
5. insertar una sesion nueva en un hueco especifico.

#### Nivel 2. Rebalanceo acotado

Ejemplos:

1. "pasa lo del jueves al viernes",
2. "agrega una sesion extra esta semana",
3. "quita carga de los martes".

Aqui el motor debe trabajar sobre una ventana afectada, por ejemplo `7-14 dias`.

#### Nivel 3. Replanificacion parcial

Ejemplos:

1. "ya no puedo estudiar por las noches",
2. "ahora solo puedo martes y jueves",
3. "quiero terminar una semana antes".

Aqui se recalcula desde un hito hacia adelante conservando progreso y sesiones completadas.

## Plan paso a paso

### Fase 0. Congelar deuda nueva

1. Prohibir nuevos flujos que actualicen sesiones por regex + estado local sin pasar por un servicio comun.
2. Declarar `study-plan change engine` como punto unico de entrada para cambios.
3. Separar explicitamente "generacion de plan" de "edicion de plan".

### Fase 1. Trazabilidad e instrumentacion

1. Loggear todos los intentos de cambio.
2. Guardar request del usuario, intent detectado, operaciones derivadas y resultado.
3. Medir:
   `change_request_success_rate`,
   `calendar_sync_success_rate`,
   `duplicate_event_rate`,
   `unmatched_session_rate`,
   `partial_update_rate`.

Entregable:

1. tablero de errores y fixtures reales anonimizados.

### Fase 2. Identidad estable de sesiones

1. Hacer que la UI transporte `sessionId` en cada slot editable.
2. Eliminar dependencia de matching por `date + originalStartTime` como mecanismo principal.
3. Ajustar `getChangedSessionUpdates()` para operar con ids y no solo por indice.

Entregable:

1. todos los cambios puntuales se refieren a `sessionId`.

### Fase 3. Intent parser estructurado

1. Crear un servicio nuevo, por ejemplo `study-plan-change-intent.service.ts`.
2. La IA o parser debe producir JSON validado con Zod.
3. Si el cambio afecta multiples sesiones y la referencia es ambigua, el sistema debe responder pidiendo confirmacion en vez de ejecutar.

Entregable:

1. contrato tipado `ChangeRequest`.

### Fase 4. Plan Change Engine

1. Crear un servicio nuevo, por ejemplo `study-plan-change-engine.service.ts`.
2. Implementar primero `move_session` y `resize_session`.
3. Despues `move_day`, `add_session`, `delete_session`.
4. Finalmente `rebalance_range`.

Entregable:

1. `applyChangeRequest(planState, changeRequest) -> planPatch`.

### Fase 5. Validacion de restricciones

1. extraer reglas de conflicto en un validador unico,
2. validar calendario, deadlines y cargas,
3. devolver errores de dominio entendibles.

Entregable:

1. `validatePlanPatch()` con errores estructurados.

### Fase 6. Persistencia transaccional

1. Crear endpoint nuevo para aplicar patches, por ejemplo `POST /api/study-planner/plan/apply-patch`.
2. Aplicar operaciones en transaccion.
3. Incrementar version del plan.
4. Registrar auditoria.

Entregable:

1. respuesta canonical del plan ya persistido.

### Fase 7. Reconciliacion de calendario

1. Convertir el `planPatch` en operaciones de calendario.
2. Si una sesion ya tiene `external_event_id`, hacer `update`; no crear otra.
3. Si la sesion fue eliminada, hacer `delete`.
4. Si el evento externo falta, recrearlo y reanclarlo.
5. Ejecutar reintentos controlados y registrar fallos.

Entregable:

1. `syncPlanPatchToCalendar(planPatch)` idempotente.

### Fase 8. UX de confirmacion

1. Mostrar antes de aplicar:
   que sesiones cambian,
   que fechas se afectan,
   si hay conflictos,
   si se requieren decisiones del usuario.
2. En cambios simples y no ambiguos, permitir auto-aplicar.
3. En cambios masivos, pedir confirmacion explicita.

Entregable:

1. "preview de cambios" antes de escribir.

### Fase 9. Suite de pruebas de regresion

Casos minimos:

1. mover una sesion unica,
2. mover varias sesiones del mismo dia,
3. cambiar de hora sin duplicar,
4. cambiar de fecha y verificar persistencia real,
5. conflicto con busy slot,
6. mantener nombres correctos de sesiones,
7. cambios consecutivos sobre el mismo plan,
8. reintento de sync con evento externo perdido.

Entregable:

1. fixtures con planes reales anonimizados,
2. tests unitarios del motor,
3. tests de integracion del endpoint,
4. tests E2E del flujo conversacional.

## Prioridad recomendada de implementacion

### Sprint 1

1. instrumentacion,
2. `sessionId` estable en UI,
3. persistencia correcta para cambios de fecha,
4. eliminar dependencia de indices para updates.

### Sprint 2

1. `ChangeRequest` tipado,
2. `Plan Change Engine` para `move_session`, `resize_session`, `move_day`,
3. endpoint transaccional de patch.

### Sprint 3

1. reconciliador de calendario idempotente,
2. auditoria,
3. preview de cambios,
4. tests de regresion.

### Sprint 4

1. replanificacion parcial,
2. rebalanceo por ventana,
3. optimizacion de restricciones B2B.

## Que NO recomiendo hacer

1. seguir agregando regex ad hoc para cada frase nueva del usuario,
2. seguir usando el indice del arreglo como referencia implicita de sesion,
3. seguir permitiendo que frontend actualice estado local sin una escritura canonical al backend,
4. recrear eventos de calendario por defecto cuando existe uno actualizable,
5. recalcular todo el plan para cambios pequenos.

## Donde si conviene usar IA

La IA sigue siendo util para:

1. interpretar lenguaje natural a un `ChangeRequest`,
2. resumir al usuario lo que va a pasar,
3. pedir aclaraciones cuando haya ambiguedad,
4. sugerir alternativas cuando un patch viola restricciones.

La IA no deberia:

1. decidir ids,
2. escribir directo en Google o Microsoft Calendar,
3. resolver matching final de sesiones,
4. mutar el estado persistido sin pasar por validacion.

## Referencias externas utiles

### APIs de calendario

1. Google Calendar API `events.insert`: crea eventos y exige `start` y `end` bien formados.
   https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
2. Google Calendar API `events.patch`: permite actualizacion parcial; Google indica que para eficiencia suele convenir `get` + `update`.
   https://developers.google.com/calendar/api/v3/reference/events/patch
3. Microsoft Graph `create event`:
   https://learn.microsoft.com/en-us/graph/api/calendar-post-events?view=graph-rest-1.0
4. Microsoft Graph `update event`: las propiedades no incluidas se conservan, lo que favorece reconciliacion incremental.
   https://learn.microsoft.com/en-us/graph/api/group-update-event?view=graph-rest-1.0

### Scheduling / optimizacion

5. Google OR-Tools scheduling overview:
   https://developers.google.com/optimization/scheduling
6. Google OR-Tools employee scheduling:
   https://developers.google.com/optimization/scheduling/employee_scheduling
7. Timefold constraints model:
   https://docs.timefold.ai/employee-shift-scheduling/latest/user-guide/constraints
8. Timefold demand-based scheduling:
   https://docs.timefold.ai/employee-shift-scheduling/latest/shift-service-constraints/demand-based-scheduling

### Repositorios open source

9. Cal.com como referencia de infraestructura de scheduling real:
   https://github.com/calcom/cal.com

## Conclusiones ejecutivas

1. El problema no se resuelve solo afinando prompts.
2. La mejor opcion es un flujo hibrido: IA para interpretar, motor deterministico para aplicar, reconciliador para sincronizar.
3. El primer bloque de valor debe enfocarse en identidad estable de sesiones, patch transaccional e idempotencia de calendario.
4. Si resolvemos esas tres piezas, los errores mas costosos reportados deberian caer de forma importante sin rehacer todo el planner.
