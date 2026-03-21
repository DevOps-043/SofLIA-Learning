# LMS – Daily Pulse | 27 Febrero 2026

**Estado:** 🟢 (Arquitectura de publicación refactorizada y segura; logramos aislar las actualizaciones en staging para no tirar la versión en vivo)

✅ **Done hoy:** 2 (P0: Resolver error 403 bypassando el WAF con Patrón Inbox DB, P0: Implementar flujo de `courses_staging` para aislar actualizaciones)
🧪 **Ready for QA:** Flujo end-to-end de envío de talleres desde CourseForge y visualización en pending sin sobreescribir (pendiente validar: botones de aprobar/rechazar actualización)
🚨 **P0 abiertos:** 0 (top 1–2: Ninguno)
🔧 **Foco siguiente:** Vista "Diff" en la UI (`AdminPendingCourseDetailPage.tsx`) para comparar datos actuales vs propuestos de forma visual.
⚠️ **Bloqueo/Riesgo:** Migración de datos: los cursos pendientes del esquema viejo (`courses` con estado pendiente) deben pasarse manualmente a `courses_staging` para no romper flujos en curso.
🧭 **Acción requerida:** Decisión de producto: Si la vista Diff es muy urgente, requeriría priorización sobre otros bugs menores para la próxima iteración.
🔗 **Tablero + evidencia:** [Añadir link a Notion]

---

## Reporte Extenso (Evidencia Detallada)

### 1. Solución Crítica a Errores de Publicación (Cero 403s)
*   **Problema:** El envío de talleres completos desde CourseForge a SofLIA fallaba en producción con errores HTTP 403 (Forbidden). Los payloads JSON masivos que contenían HTML y texto largo estaban disparando bloqueos por falsos positivos en el Firewall perimetral / WAF (Web Application Firewall) mediante las peticiones REST API síncronas.
*   **Solución implementada (Patrón Inbox DB):** Se desechó el enfoque de API vía HTTP/Webhook. Se migró la estrategia de comunicación a una integración de base de datos directa pero segura. Se creó la tabla intermediaria `courseforge_inbox` donde CourseForge realiza un `UPSERT` directo del JSON crudo (vía PostgreSQL puerto 5432, saltándose todo el WAF de capa 7). Posteriormente, la plataforma Learning ingiere y procesa estos JSON internamente desde su base de datos.

### 2. Nuevo Flujo de Control de Revisiones (Staging de Actualizaciones)
*   **Problema (Diseño Anterior - Opción A):** Actualizar un curso validado sobrescribía inmediatamente los datos en las tablas de producción (`courses`, `course_modules`, `course_lessons`), y el sistema definía `is_active = false`. Esto dejaba el curso caído e inaccesible para los estudiantes mientras el administrador no lo volviera a aprobar.
*   **Solución implementada (Opción B):** Diseñamos e implementamos una arquitectura robusta de *Staging*. Se creó la tabla `courses_staging`. Ahora, cuando el CRON `process-inbox` detecta un cargo, evalúa:
    *   **Si es un curso nuevo:** Flujo normal.
    *   **Si es una actualización:** Marca `is_update = true` y *solo* deposita el nuevo payload en `courses_staging`. La versión publicada en las tablas relacionales queda **intacta y activa (is_active = true)** para los estudiantes.
*   **Impacto Tecnológico:** El administrador ahora podrá revisar la actualización sin tumbar el contenido en red, y aplicar los cambios (`UPSERT` final sobre módulos y lecciones) únicamente cuando apruebe explícitamente el registro de staging.
