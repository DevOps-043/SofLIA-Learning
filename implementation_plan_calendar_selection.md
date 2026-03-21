# Plan de Implementación: Selección de Calendarios para el Planificador

## Objetivo
El objetivo es permitir que los usuarios seleccionen qué calendarios específicos (de Google o Microsoft) deben tenerse en cuenta para el análisis de disponibilidad ("Free/Busy"). Esto evita que el sistema identifique erróneamente a un usuario como ocupado basándose en calendarios compartidos o institucionales que no desea utilizar para la planificación del estudio.

## Cambios Propuestos

### [Componente] Backend: Servicio de Integración de Calendario
Resumen: Actualizar el servicio principal para manejar el listado de calendarios y respetar la selección del usuario.

#### [MODIFICAR] [CalendarIntegrationService.ts](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/services/calendar-integration.service.ts)
- Implementar `getMicrosoftCalendarList(accessToken)` para obtener todos los calendarios de Microsoft.
- Añadir `syncSelectedCalendars(userId, calendarIds)` para almacenar `{ "selected_calendar_ids": [...] }` en la columna `metadata`.
- Actualizar `getGoogleCalendarEvents` y `getMicrosoftCalendarEvents` para filtrar eventos por `selected_calendar_ids` si están presentes en los metadatos.
- Actualizar `getFreeBusyInfo` para filtrar los `items` por `selected_calendar_ids`.

### [Componente] Backend: Endpoints de la API
Resumen: Endpoints expuestos para que el frontend pueda listar y guardar calendarios.

#### [NUEVO] [list-calendars/route.ts](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/calendar/list/route.ts)
- Endpoint GET para devolver todos los calendarios disponibles para la integración del usuario actual.

#### [NUEVO] [save-selection/route.ts](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/calendar/selected/route.ts)
- Endpoint POST para actualizar los `selected_calendar_ids` en la base de datos.

### [Componente] Frontend: UI de Conexión de Calendario
Resumen: Actualizar la interfaz de usuario para mostrar casillas de verificación para la selección de calendarios.

#### [MODIFICAR] [CalendarConnection.tsx](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/CalendarConnection.tsx)
- Añadir un nuevo estado para rastrear `availableCalendars` y `selectedIds`.
- Después de una conexión exitosa (o si ya está conectado), mostrar la lista de calendarios con casillas de verificación.
- Añadir un botón de **"Refrescar"** para volver a escanear los calendarios sin recargar la página.
- Implementar validación para asegurar que al menos un calendario esté seleccionado.
- Añadir la funcionalidad "Guardar" para sincronizar la selección con el backend.

---

## Plan de Verificación

### Verificación Manual
1. **Conectar Calendario**: Conectar una cuenta de Google/Microsoft.
2. **Escanear**: Verificar que aparece una lista de todos "Mis calendarios" y calendarios compartidos.
3. **Seleccionar**: Seleccionar solo el calendario "Principal" propio.
4. **Resincronizar**: Hacer clic en "Refrescar" y asegurar que la lista se actualiza correctamente.
5. **Verificar Conflictos**: Verificar que solo los eventos del calendario seleccionado se consideren tiempo ocupado durante la generación del plan (por ejemplo, si un calendario compartido tiene un conflicto, debe ignorarse si no está seleccionado).
6. **Verificar Dashboard**: Asegurar que la vista del calendario del tablero refleja la selección.

### Pruebas Automatizadas
- No se han encontrado pruebas automatizadas existentes para este flujo específico. Se recomienda la verificación manual en el entorno de pruebas.
