# Study Planner Multi-Plan: Pendientes Para La Proxima Sesion

## Estado actual

Ya se implemento la base de multi-plan para Study Planner:

- Listado de planes por usuario.
- Dashboard con selector de plan.
- Boton `Nuevo plan` que ya no elimina el plan actual.
- Borrado por `planId` explicito.
- `/create` filtrando cursos que ya tienen plan activo.
- Rechazo backend si se intenta crear un segundo plan para el mismo curso.
- Calendario, sesiones y dashboard leyendo el `planId` seleccionado.

## Pendiente principal

La parte mas importante que falta cerrar es la experiencia conversacional de SofLIA cuando hay multiples planes.

Hoy el dashboard ya trabaja con el `planId` seleccionado, pero todavia falta endurecer estos casos:

1. Si el usuario tiene multiples planes y el mensaje es ambiguo, SofLIA debe preguntar explicitamente que plan quiere modificar.
2. La proactividad de SofLIA debe mencionar o seleccionar correctamente el plan objetivo.
3. Si llega una accion sin `activePlanId` claro, el backend no deberia asumir silenciosamente el plan mas reciente.

## Archivos clave para retomar

### Backend / contexto conversacional

- [route.ts](C:\Users\Lordg\OneDrive\Desktop\Laburo\SofLIA-Learning\apps\web\src\app\api\study-planner\dashboard\chat\route.ts)
- [chat-request.service.ts](C:\Users\Lordg\OneDrive\Desktop\Laburo\SofLIA-Learning\apps\web\src\app\api\study-planner\dashboard\chat\chat-request.service.ts)
- [context.service.ts](C:\Users\Lordg\OneDrive\Desktop\Laburo\SofLIA-Learning\apps\web\src\app\api\study-planner\dashboard\chat\context.service.ts)
- [gemini-chat.service.ts](C:\Users\Lordg\OneDrive\Desktop\Laburo\SofLIA-Learning\apps\web\src\app\api\study-planner\dashboard\chat\gemini-chat.service.ts)
- [chat-actions.service.ts](C:\Users\Lordg\OneDrive\Desktop\Laburo\SofLIA-Learning\apps\web\src\app\api\study-planner\dashboard\chat\chat-actions.service.ts)

### Frontend / dashboard

- [useStudyPlannerDashboardLogicV2.ts](C:\Users\Lordg\OneDrive\Desktop\Laburo\SofLIA-Learning\apps\web\src\features\study-planner\hooks\useStudyPlannerDashboardLogicV2.ts)
- [useDashboardSofLIAFetch.ts](C:\Users\Lordg\OneDrive\Desktop\Laburo\SofLIA-Learning\apps\web\src\features\study-planner\hooks\useDashboardSofLIAFetch.ts)
- [useDashboardSofLIAState.ts](C:\Users\Lordg\OneDrive\Desktop\Laburo\SofLIA-Learning\apps\web\src\features\study-planner\hooks\useDashboardSofLIAState.ts)
- [StudyPlannerDashboardToolbarV2.tsx](C:\Users\Lordg\OneDrive\Desktop\Laburo\SofLIA-Learning\apps\web\src\features\study-planner\components\dashboard\StudyPlannerDashboardToolbarV2.tsx)

### Fuente comun de planes

- [study-planner-plans.server.service.ts](C:\Users\Lordg\OneDrive\Desktop\Laburo\SofLIA-Learning\apps\web\src\features\study-planner\services\study-planner-plans.server.service.ts)

## Recomendacion de implementacion

### Paso 1

Crear una validacion central tipo `resolvePlanSelectionForChat(...)` que:

- reciba `userId`, `activePlanId`, `message`;
- obtenga los planes del usuario;
- si hay 0 planes, responda sin accion;
- si hay 1 plan, use ese;
- si hay varios y no hay `activePlanId`, devuelva estado `needs_plan_selection`.

Lugar sugerido:

- nuevo helper dentro de `dashboard/chat`, cerca de `context.service.ts` o `chat-request.service.ts`.

### Paso 2

Cuando `needs_plan_selection` ocurra:

- responder con un mensaje tipo:
  - "Tienes varios planes activos. Dime cual quieres modificar: Curso A, Curso B..."
- no ejecutar ninguna accion.

### Paso 3

Actualizar el prompt de SofLIA en `gemini-chat.service.ts` para reforzar:

- nunca asumir un plan si hay varios;
- si el usuario dice algo ambiguo como "mueve mi sesion del viernes", primero pedir el plan;
- al responder proactivamente, mencionar el nombre del plan o curso.

### Paso 4

Revisar `context.service.ts` para eliminar fallback silencioso a "ultimo plan" cuando no hay `planId`.

Comportamiento deseado:

- si hay varios planes y no viene `planId`, no armar contexto de uno arbitrario;
- si hay uno solo, si se puede usar automaticamente.

## Pruebas recomendadas

### Manuales

1. Crear dos planes de cursos distintos.
2. Entrar al dashboard y cambiar entre ambos desde el selector.
3. Enviar mensaje ambiguo:
   - "mueve mi sesion del viernes"
   - esperado: SofLIA pregunta cual plan.
4. Enviar mensaje especifico con un plan ya seleccionado.
   - esperado: actua sobre ese plan y no sobre el otro.
5. Probar `Nuevo plan`.
   - esperado: solo redirige a `/study-planner/create`.
6. Probar eliminar.
   - esperado: elimina solo el plan seleccionado.

### Tecnicas

- Agregar tests unitarios para resolucion de plan en chat.
- Agregar tests de integracion para `dashboard/chat`.
- Si el entorno lo permite, correr `tsc` y `vitest`.

## Riesgos a vigilar

- Que algun endpoint de chat siga cayendo al "plan mas reciente".
- Que el calendario muestre sesiones de otro plan si falta propagar `planId`.
- Que SofLIA ejecute acciones sobre un plan incorrecto por contexto residual.
- Que el usuario no entienda sobre que plan esta actuando si no se menciona el curso/plan en la respuesta.

## Nota del entorno

En esta sesion no se pudieron correr validaciones completas automatizadas por limitaciones previas del entorno con `vitest` y `tsc`, asi que antes de cerrar la incidencia conviene hacer:

- una pasada de pruebas manuales en UI;
- una corrida de tipos;
- una corrida de tests cuando el entorno lo permita.
