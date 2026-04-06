# Requerimientos del Planificador de Estudios — SofLIA

> Extraídos del resumen ejecutivo de reunión ([rsmn.md](file:///d:/Pulse%20Hub/SofLIA-Learning/rsmn.md))

---

## 1. Requerimientos Funcionales

### 1.1 Planificación por Curso (no por ruta completa)

| ID | Requerimiento | Prioridad |
|----|--------------|-----------|
| RF-01 | La unidad principal de planificación debe ser **el curso individual**, no la ruta completa de cursos | 🔴 Alta |
| RF-02 | El planificador **no debe planificar automáticamente todos los cursos asignados** al iniciar conversación con Soflía | 🔴 Alta |
| RF-03 | Cuando el usuario tenga varios cursos asignados sin secuencia obligatoria, el sistema debe presentar un **paso explícito de selección** para que elija cuál curso desea planificar | 🔴 Alta |
| RF-04 | Si existe una ruta secuencial, el sistema debe **llevar automáticamente al usuario al siguiente curso** tras completar el anterior | 🔴 Alta |

### 1.2 Rutas de Aprendizaje (Learning Paths)

| ID | Requerimiento | Prioridad |
|----|--------------|-----------|
| RF-05 | Incorporar la entidad de **Ruta de Aprendizaje** con: cursos asociados, orden/secuencia y reglas de desbloqueo | 🔴 Alta |
| RF-06 | Las rutas son conjuntos de cursos agrupados por categoría (ej. liderazgo, pensamiento analítico, IA) | 🟡 Media |
| RF-07 | Si la ruta es secuencial, los cursos se desbloquean progresivamente (curso 1 → curso 2 → curso 3) | 🔴 Alta |
| RF-08 | Si los cursos asignados **no** están secuenciados, el usuario puede escoger libremente cuál planificar primero | 🟡 Media |
| RF-09 | Al concluir un curso dentro de una ruta secuencial, activar automáticamente la planificación del siguiente | 🔴 Alta |

### 1.3 Asignación y Control

| ID | Requerimiento | Prioridad |
|----|--------------|-----------|
| RF-10 | El usuario **no elige qué cursos se le asignan**; la asignación la define la empresa o la lógica de asignación (RR.HH. / capacitación) | 🔴 Alta |
| RF-11 | El sistema debe presentar a RR.HH. una **propuesta de fecha de inicio y fecha de fin** para cada asignación | 🟡 Media |
| RF-12 | La asignación y liberación de cursos debe poder hacerse **por olas, tandas o periodos** definidos | 🟡 Media |

---

## 2. Requerimientos de Configuración Empresarial (B2B)

| ID | Requerimiento | Prioridad |
|----|--------------|-----------|
| RC-01 | Permitir configuración de **horarios laborales** por organización | 🔴 Alta |
| RC-02 | Permitir configuración de **días de trabajo** (hábiles) | 🔴 Alta |
| RC-03 | Permitir configuración de **festivos oficiales** | 🔴 Alta |
| RC-04 | Permitir configuración de **festivos internos / excepciones** propias de cada organización | 🟡 Media |
| RC-05 | Permitir configuración de **ventanas de inicio y fin** para cursos/rutas | 🔴 Alta |
| RC-06 | Modelar fechas **por estructura organizacional** (no solo de forma global) | 🟡 Media |
| RC-07 | Separar la **ventana administrativa** (inicio/fin) del **momento exacto** en que el usuario decide tomar la lección | 🔴 Alta |

---

## 3. Requerimientos de UX

| ID | Requerimiento | Prioridad |
|----|--------------|-----------|
| RUX-01 | Cambiar el mensaje inicial de Soflía para que **no asuma** la planificación de todos los cursos | 🔴 Alta |
| RUX-02 | Separar claramente la vista de **"cursos asignados"** vs **"curso a planificar ahora"** | 🔴 Alta |
| RUX-03 | Mostrar al usuario: cursos asignados, curso recomendado, curso obligatorio por secuencia y ventana disponible | 🟡 Media |
| RUX-04 | Hacer visible cuándo una ruta es **secuencial** y cuándo **no** | 🟡 Media |
| RUX-05 | Reducir ambigüedad sobre qué puede decidir el usuario y qué ya fue definido por la empresa | 🟡 Media |

---

## 4. Requerimientos de Lógica de Negocio

| ID | Requerimiento | Prioridad |
|----|--------------|-----------|
| RN-01 | El diseño instruccional asume **microlearning**: 1 o máximo 2 lecciones por día para C-levels | 🟡 Media |
| RN-02 | No imponer un horario rígido diario al usuario final, pero sí mantener una **ventana temporal de inicio/fin** acordada con la organización | 🔴 Alta |
| RN-03 | Dentro de la ventana organizacional, el usuario debe tener **cierto margen** para decidir cuándo tomar las lecciones | 🟡 Media |
| RN-04 | El planificador debe alinearse con el **comprador real del modelo B2B**: gobernanza empresarial + flexibilidad operativa | 🔴 Alta |

---

## 5. Bugs Críticos a Resolver

| ID | Bug | Impacto | Responsable |
|----|-----|---------|-------------|
| BUG-01 | **Reinicio de sesión / pérdida de contexto** al vincular cuenta de Google o Microsoft. La página se refresca y se pierde el hilo conversacional | 🔴 Crítico — rompe continuidad del flujo | Fernando Suárez González |
| BUG-02 | El planificador **planifica automáticamente todos los cursos** asignados en lugar de permitir selección individual | 🔴 Crítico — contradice la lógica de negocio definida | Fernando Suárez González |

---

## 6. Riesgos Identificados

### Técnicos
- El planificador puede volverse excesivamente complejo si mezcla sin diseño claro: múltiples cursos, rutas secuenciales, calendario personal, reglas empresariales, restricciones de horario y reportes de cumplimiento

### De UX
- Planificar automáticamente todos los cursos genera fricción, confusión y sensación de falta de control
- La pérdida del hilo conversacional por el bug de autenticación deteriora fuertemente la experiencia

### De Negocio
- Poca flexibilidad para C-levels → pierde atractivo frente a soluciones abiertas
- Demasiada flexibilidad sin control → pierde valor para compradores B2B

### De Cumplimiento
- Reglas incompletas sobre horarios laborales vs capacitación válida (STPS, Ley Federal del Trabajo)

### De Escalabilidad Comercial
- Falta de definición de granularidad por estructura organizacional puede impedir implementación consistente en clientes grandes

---

## 7. Preguntas Abiertas (Requieren Definición)

> [!IMPORTANT]
> Estas preguntas deben cerrarse antes de iniciar la implementación completa del planificador.

| # | Pregunta Abierta | Área |
|---|-----------------|------|
| 1 | ¿La configuración de fechas será por **empresa, área, departamento, jerarquía o excepciones individuales**? ¿Cuál será el nivel mínimo de granularidad? | Configuración B2B |
| 2 | ¿Se permitirá toma de cursos **fuera de horario laboral**? Si sí, ¿cómo se reflejará en reportes? | Cumplimiento / Reportes |
| 3 | ¿Qué grado exacto de **flexibilidad** tendrá el usuario final dentro de la ventana organizacional? | Lógica de negocio |
| 4 | ¿Los C-levels tendrán **reglas diferenciadas** (ventanas más abiertas, criterios distintos de cierre)? | Lógica de negocio |
| 5 | ¿El sistema generará un **reporte "formal"** compatible con cumplimiento aunque el usuario haya tomado cursos en horarios flexibles? | Reportes |
| 6 | ¿Quién es responsable de definir e implementar el **modelo de rutas de aprendizaje**? | Ownership |
| 7 | ¿Quién es responsable de cerrar las **reglas de negocio** para flexibilidad vs control? | Ownership |

---

## 8. Responsables Confirmados

| Tarea | Responsable |
|-------|-------------|
| Corregir bug de vinculación Google/Microsoft | Fernando Suárez González |
| Modificar flujo del planificador (no planificar todo automáticamente) | Fernando Suárez González |
| Agregar lógica de selección de curso (múltiples cursos sin secuencia) | Fernando Suárez González |
| Pruebas previas a liberación | Israel Martínez Arias |
| Definir modelo de rutas de aprendizaje | ⚠️ Pendiente por confirmar |
| Definir granularidad de configuración empresarial | ⚠️ Pendiente por confirmar |
| Cerrar reglas de flexibilidad vs control | ⚠️ Pendiente por confirmar |
| Precisar requisitos de reporte/cumplimiento | ⚠️ Pendiente por confirmar |

---

## Resumen de Conteo

| Categoría | Cantidad |
|-----------|----------|
| Requerimientos Funcionales | 12 |
| Requerimientos de Configuración B2B | 7 |
| Requerimientos de UX | 5 |
| Requerimientos de Lógica de Negocio | 4 |
| Bugs Críticos | 2 |
| Preguntas Abiertas | 7 |
| **Total** | **37** |
