# Integración de Detección de Bloques de Trabajo (Work Blocks) en Google Calendar

## Objetivo
Refactorizar el módulo de disponibilidad (`calendar-availability.service.ts`) para que el planificador de estudios detecte automáticamente los eventos de Google Calendar que representan la **Jornada Laboral** (ej. eventos de 8 horas llamados "Trabajo" o "Jornada"), usándolos como el *contenedor principal de disponibilidad* para agendar sesiones, en lugar de considerarlos como horas "Ocupadas" a evitar. Esto garantiza el cumplimiento de la política de capacitación en horarios laborales.

## Detalles de Heurística de Detección

Para evitar que una simple junta de 30 minutos ("Junta de trabajo") sea tratada como toda tu jornada de disponibilidad del día, implementaremos las siguientes reglas para definir qué es un "Work Block":
1. **Duración Mínima**: El evento debe durar **3 horas o más**.
2. **Nombre del Evento**: El título del evento debe coincidir con una expresión regular flexible, que incluya palabras como: `/(trabajo|work|oficina|jornada|laboral|shift|turno)/i`. (Excluyendo explícitamente palabras como `junta|reunion|meeting|llamada`).

## Cambios Propuestos

### Lógica Core de Disponibilidad

#### [MODIFICAR] `apps/web/src/features/study-planner/services/calendar-availability.service.ts`

1. **Separación de Eventos**:
   Al inicio de `analyzeAvailability`, iterar sobre todos los `events` y separarlos en dos grupos funcionales:
   - `workBlocks`: Eventos >= 3 horas cuyo título pase la heurística de Jornada Laboral.
   - `standardEvents (busySlots)`: El resto de los eventos convencionales (juntas, comidas, médicos).

2. **Cálculo de Contenedor Diario (`Day Availability Container`)**:
   Para cada día iterado (dentro del loop `while (currentDate <= endDateObj)`):
   - **Caso A (Hay WorkBlocks en el día)**: Los fragmentos de disponibilidad (`freeSlots`) *base* iniciales del día serán exclusivamente los periodos definidos por esos `workBlocks`. (Ej. Si tienes dos WorkBlocks: 08:00 a 13:00 y 14:00 a 18:00, el sistema iniciará asumiendo que tienes 9 horas libres distribuidas en esos dos bloques).
   - **Caso B (No hay WorkBlocks en el día)**: Se hace "Fallback" al comportamiento actual, utilizando un solo contenedor genérico basado en el parámetro `workingHours` (08:00 a 20:00).

3. **Sustracción de Juntas (Busy Slots)**:
   Tomar los Contenedores Base resultantes del paso 2, y *restarle matemáticamente* los tiempos de los `standardEvents` que se traslapen internamente. 

### Pruebas

#### [NUEVO] `apps/web/src/features/study-planner/services/__tests__/calendar-availability.service.test.ts`

Crear pruebas unitarias comprobando este nuevo borde lógico:
- Mock: 1 evento llamado "Trabajo" de 9:00 a 18:00.
- Mock: 1 evento llamado "Comida" de 14:00 a 15:00.
- Mock: 1 evento llamado "Junta de sincronización de trabajo" de 10:00 a 11:00.
- Expectativa: La salida (`freeSlots`) debe retornar exactamente 3 espacios: `[09:00 - 10:00, 11:00 - 14:00, 15:00 - 18:00]`.

## Pregunta Abierta (Para definición de Arquitectura)

- Si un usuario programa bloqueos diarios llamados "Trabajo Profundo" (Focus Time) de 4 horas en la mañana, ¿la heurística debería tratarlo como "Tiempo Libre para Estudiar" y meter sesiones ahí dentro, o "Trabajo Profundo" debería ir a una lista negra de exclusión para proteger la concentración del desarrollador?
