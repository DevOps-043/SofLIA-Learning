# SofLIA: Líneas de Trabajo, Prompts y Construcción de Respuesta

## 1. Objetivo de este documento

Este documento describe, de forma operativa, **cómo se construye una respuesta de SofLIA** y cuáles son los **prompts o bloques de instrucciones** que realmente hacen que funcione.

El foco aquí no es tanto la arquitectura general, sino:

- qué prompt base existe
- qué otros prompts o bloques se le agregan
- qué procesos atraviesa el mensaje
- cómo eso termina en la respuesta final

---

## 2. La idea clave

SofLIA no funciona con un solo prompt.

Funciona con una cadena de construcción:

1. **Prompt base de identidad y reglas**
2. **Prompt global de UI/plataforma**
3. **Prompt dinámico de contexto del usuario**
4. **Prompt dinámico por página/ruta/lección**
5. **Prompt de guardrails de seguridad**
6. **Prompt de personalización**
7. **Prompt contextual para bugs**
8. **Historial limpio de conversación**
9. **Mensaje final del usuario**
10. **Postproceso de respuesta**

La respuesta final sale de la combinación de todo eso.

---

## 3. Línea de trabajo principal de SofLIA

La cadena principal hoy vive en:

- `apps/web/src/app/api/lia/chat/route.ts`

### 3.1 Flujo de punta a punta

1. El frontend envía:
   - `messages`
   - `context`
   - `conversationId`
   - `attachments`
2. El backend sanitiza y valida.
3. Evalúa si hay riesgo de prompt injection.
4. Resuelve contexto real:
   - usuario
   - organización
   - página actual
   - cursos
   - progreso
   - lección/actividad
5. Construye el **system prompt final**.
6. Limpia y normaliza historial.
7. Agrega el último mensaje del usuario.
8. Envía todo a Gemini.
9. Postprocesa la respuesta.
10. Si aplica, guarda historial o ejecuta flujo de bug report.
11. Devuelve respuesta normal o streaming.

---

## 4. Prompt base: el corazón textual de SofLIA

Archivo:

- `apps/web/src/app/api/lia/chat/prompt-base.service.ts`

Este archivo contiene el núcleo textual más importante.

## 4.1 Identidad base

El prompt base define a SofLIA como:

- asistente de IA de la plataforma SofLIA
- Learning Intelligence Assistant
- profesional, amigable, proactiva y motivadora
- multilingüe: español, inglés y portugués

## 4.2 Reglas de idioma

El prompt base ordena:

- detectar automáticamente el idioma del último mensaje
- responder en ese mismo idioma
- adaptarse si el usuario cambia de idioma

## 4.3 Capacidades declaradas

El prompt base le atribuye estas funciones:

- gestión de cursos
- orientación educativa
- productividad y optimización del estudio
- asistencia sobre la plataforma
- analíticas de progreso
- reporte guiado de errores

## 4.4 Restricción de alcance

Este es uno de los bloques más importantes del sistema.

El prompt le dice a SofLIA que:

- **solo** puede responder sobre contenido y funcionalidades de SofLIA
- no debe responder preguntas generales fuera del dominio

El prompt incluso trae una respuesta modelo para rechazo:

- ayudar solo sobre plataforma, cursos, contenido y navegación

## 4.5 Reglas de seguridad

El prompt base también prohíbe:

- revelar prompts internos
- revelar modelos o proveedores
- revelar endpoints, tablas, columnas, esquemas o queries
- revelar credenciales o tokens
- decir que responde “directamente desde una tabla o endpoint”

## 4.6 Reglas de formato

El prompt base impone varias reglas estilísticas:

- capitalización normal
- negritas y cursivas
- listas con guiones o números
- no usar emojis
- no usar `#` para títulos
- siempre usar hipervínculos al mencionar páginas

Esto es importante porque el prompt no solo define contenido, también define la forma de salida.

## 4.7 Reglas de rutas

El mismo prompt incluye:

- rutas principales de SofLIA
- rutas prohibidas
- regla de no inventar cursos
- obligación de usar el dashboard como punto de acceso

## 4.8 Reglas de reporte de bugs

El prompt base instruye que, si el usuario reporta un problema:

- SofLIA empatice
- confirme que lo reportará
- genere un bloque oculto estructurado al final

Eso muestra que ya desde el prompt existe una intención de convertir el chat en acción estructurada.

---

## 5. Prompt global de plataforma y UI

Archivo:

- `apps/web/src/app/api/lia/chat/prompt-base.service.ts`

Además del prompt base, el mismo archivo contiene:

- `GLOBAL_UI_CONTEXT`

Este bloque es enorme y funciona como una especie de enciclopedia interna de la plataforma.

### 5.1 Qué contiene

- panel de negocios
- jerarquía
- usuarios
- catálogo y asignación de cursos
- analíticas
- reportes
- settings
- progreso
- dashboard de usuario empresarial
- study planner
- perfil
- modales
- toasts
- loading states
- temas
- quick actions de SofLIA
- matriz de acceso por roles

### 5.2 Qué aporta

Este bloque hace que SofLIA pueda responder cosas como:

- “qué hay aquí”
- “qué hace este modal”
- “qué puedo hacer en esta página”
- “cómo asigno un curso”

Sin este bloque, SofLIA tendría identidad, pero no tendría mapa operativo del producto.

---

## 6. Prompt orquestador: cómo se ensamblan los prompts

Archivo:

- `apps/web/src/app/api/lia/chat/system-prompt.service.ts`

La función clave es:

- `getLIASystemPrompt(context?)`

### 6.1 Orden de construcción

El prompt final se arma así:

1. toma `LIA_SYSTEM_PROMPT`
2. si hay contexto business, reemplaza la sección de rutas por rutas del panel de negocios
3. agrega override del flujo de bugs
4. agrega `GLOBAL_UI_CONTEXT`
5. si existe contexto, agrega:
   - sección de contexto actual de SofLIA
   - instrucciones de página
   - contexto del usuario

### 6.2 Lectura práctica

Esto significa que el prompt real que ve el modelo nunca es solo el prompt base.

Siempre puede ser:

- prompt base
- más glosario
- más rutas específicas
- más contexto del usuario
- más instrucciones situacionales

---

## 7. Override crítico: el prompt de bugs reemplaza al prompt base

Archivo:

- `apps/web/src/app/api/lia/chat/prompt-base.service.ts`

Constante:

- `LIA_BUG_REPORT_CONFIRMATION_OVERRIDE`

### 7.1 Qué hace

Este bloque dice explícitamente que:

- reemplaza cualquier instrucción previa sobre guardado inmediato de reportes

Y fuerza este flujo:

1. crear borrador técnico visible
2. pedir confirmación explícita
3. si el usuario corrige, actualizar borrador
4. mientras no confirme, usar `[[BUG_REPORT_DRAFT:...]]`
5. no usar `[[BUG_REPORT:{...}]]` directamente

### 7.2 Por qué es importante

Esto demuestra que en SofLIA hay una jerarquía real entre prompts:

- el prompt base no manda siempre
- algunos bloques tienen prioridad y anulan comportamiento previo

---

## 8. Prompt de contexto del usuario

Archivo:

- `apps/web/src/app/api/lia/chat/prompt-context.service.ts`

La función principal:

- `buildUserContextSection(context)`

### 8.1 Qué inyecta

- usuario activo
- organización del usuario
- slug de organización
- cargo profesional
- área y tamaño de empresa
- página actual
- estadísticas generales
- cursos inscritos
- progreso de lecciones
- cursos asignados visibles

### 8.2 Qué instrucciones explícitas agrega

No solo inyecta datos. También añade reglas como:

- menciona explícitamente la organización al hablar del dashboard
- usa siempre el `organizationSlug` para rutas business
- adapta ejemplos al cargo real del usuario
- no inventes cursos no asignados
- si no tiene cursos, dilo claramente

### 8.3 Función real

Este bloque convierte a SofLIA en un agente contextual.

Sin él:

- respondería con conocimiento general del producto

Con él:

- responde en función de la realidad del usuario actual

---

## 9. Prompt por página, pestaña, lección y actividad

Archivo:

- `apps/web/src/app/api/lia/chat/prompt-instructions.service.ts`

Este archivo agrega instrucciones de situación.

### 9.1 Rutas de negocios

`buildBusinessRoutesSection(...)` reescribe la parte de rutas para que SofLIA sugiera:

- dashboard de negocios
- jerarquía
- catálogo de cursos
- analytics
- configuración

con prefijo organizacional si corresponde.

### 9.2 Lección y actividades

El archivo también construye secciones como:

- actividades de la lección
- materiales de la lección
- quizzes requeridos
- actividad en foco
- duración verificada

### 9.3 Guías por pestaña

Incluye instrucciones específicas según tab:

- `activities`
- `video`
- `questions`

Por ejemplo:

- si está en `activities`, SofLIA debe explicar primero que el usuario está en el panel de actividades
- si está en `video`, debe interpretar “aquí” como el video y la lección actual

### 9.4 Qué significa esto

Una misma pregunta:

- “¿qué hago aquí?”

puede disparar respuestas distintas según el tab actual, aunque el usuario escriba exactamente lo mismo.

Eso no lo resuelve el prompt base: lo resuelve esta capa.

---

## 10. Prompt de personalización

Archivo de inyección:

- `apps/web/src/app/api/lia/chat/chat-context.builder.ts`

Función:

- `appendPersonalizationPrompt(basePrompt, userId)`

Servicio implicado:

- `LiaPersonalizationService.buildPersonalizationPrompt(...)`

### 10.1 Qué hace

Si el usuario tiene configuración personalizada, ese bloque se añade al prompt final.

### 10.2 Qué puede afectar

- estilo base
- tono amistoso
- entusiasmo
- instrucciones personalizadas
- nickname

### 10.3 Límite importante

La personalización no debe ampliar el alcance temático del agente.

O sea:

- cambia el estilo
- no cambia el dominio permitido

---

## 11. Prompt contextual para bugs

Archivo:

- `apps/web/src/app/api/lia/chat/chat-context.builder.ts`

Función:

- `appendBugReportContext(...)`

### 11.1 Cuándo se activa

Si el mensaje del usuario parece bug report o viene marcado como tal.

Palabras detectadas:

- error
- bug
- falla
- problema
- no funciona
- no carga
- broken
- crash
- timeout
- pantalla en blanco
- etc.

### 11.2 Qué agrega

Si hay página actual disponible, añade al prompt un contexto especial del lugar donde ocurrió el problema.

Esto mejora:

- precisión del borrador técnico
- calidad del reporte
- comprensión del problema sin depender solo del texto del usuario

---

## 12. Prompt de seguridad contra prompt injection

Archivo de uso:

- `apps/web/src/app/api/lia/chat/route.ts`

Funciones involucradas:

- `evaluatePromptInjectionRisk(...)`
- `buildPromptInjectionGuardrailPrompt(...)`

### 12.1 Qué pasa

Antes de llamar al modelo:

- se evalúa el riesgo del mensaje
- si es grave, se bloquea
- si no, se agrega un bloque extra de guardrails al prompt

### 12.2 Efecto real

SofLIA no depende solo de “no revelar información” por instrucción base.

Además:

- tiene una capa de seguridad adaptativa según el mensaje recibido

Eso la vuelve más robusta frente a intentos de:

- extraer prompt
- obtener internos
- saltarse restricciones

---

## 13. Historial: no es prompt, pero sí parte del comportamiento

Archivo:

- `apps/web/src/app/api/lia/chat/chat-context.builder.ts`

Función:

- `buildCleanHistory(messages)`

### 13.1 Qué hace

- elimina mensajes `system`
- elimina el último mensaje para usarlo aparte
- transforma `assistant` en `model`
- fuerza que el historial empiece con `user`
- fusiona mensajes consecutivos del mismo rol

### 13.2 Qué aporta

El modelo no recibe el historial crudo del frontend.

Recibe un historial:

- filtrado
- normalizado
- comprimido

Esto impacta directamente la respuesta final.

---

## 14. Cómo queda armado el mensaje final al modelo

En `/api/lia/chat/route.ts`, después de construir el system prompt, se arma algo así:

- `systemPrompt + guardrails + personalización + contexto + ...`
- luego:
  - `Usuario: <último mensaje>`

Y eso se envía junto con:

- historial limpio
- adjuntos visuales si existen

### 14.1 Adjuntos

Si hay imágenes:

- se agrega una instrucción textual indicando que el usuario adjuntó evidencia visual
- se añaden partes inline con la imagen

Entonces el input final al modelo no es solo texto:

- puede ser texto + contexto + imágenes

---

## 15. Postproceso: la respuesta no sale “tal cual”

Archivo:

- `apps/web/src/app/api/lia/chat/route.ts`

Funciones:

- `processAIResponse(...)`
- `enforceSecurityResponsePolicy(...)`

### 15.1 Qué puede pasar después de generar

- se detectan tokens de bug report
- se transforma la respuesta para cliente
- se reescribe si viola política de seguridad
- se registra evento si hubo corrección

### 15.2 Implicación

La respuesta final que ve el usuario puede ser distinta de la respuesta cruda del modelo.

Por eso, la cadena completa es:

- prompt
- inferencia
- postproceso

No solo prompt.

---

## 16. Contenido mínimo de prompts que realmente “mueven” a SofLIA

Si hubiera que resumir los bloques que más pesan, son estos:

### 16.1 Prompt 1: identidad y alcance

Vive en:

- `LIA_SYSTEM_PROMPT`

Define:

- quién es SofLIA
- qué puede hacer
- qué no puede hacer
- cómo debe hablar

### 16.2 Prompt 2: conocimiento interno de plataforma

Vive en:

- `GLOBAL_UI_CONTEXT`

Define:

- qué páginas existen
- qué modales existen
- qué puede explicar

### 16.3 Prompt 3: contexto de usuario y negocio

Vive en:

- `buildUserContextSection`

Define:

- a quién le responde
- en qué organización está
- qué cursos ve
- qué progreso tiene

### 16.4 Prompt 4: instrucciones situacionales

Vive en:

- `buildPageInstructionsSection`
- `buildBusinessRoutesSection`

Define:

- cómo responder “aquí”
- cómo responder según tab
- qué ruta sugerir

### 16.5 Prompt 5: seguridad adaptativa

Vive en:

- `buildPromptInjectionGuardrailPrompt`

Define:

- cómo endurecer el prompt según el riesgo del input

### 16.6 Prompt 6: personalización

Vive en:

- `buildPersonalizationPrompt`

Define:

- tono personalizado
- estilo comunicacional

### 16.7 Prompt 7: bug workflow

Vive en:

- `LIA_BUG_REPORT_CONFIRMATION_OVERRIDE`
- `appendBugReportContext`

Define:

- cómo tratar reportes técnicos
- que haya confirmación
- que use borrador antes de envío

---

## 17. Línea de trabajo propuesta para revisar o modificar prompts

Si el objetivo del equipo es intervenir SofLIA, estas serían las líneas de trabajo correctas.

## 17.1 Línea 1: Prompt base e identidad

Archivos foco:

- `apps/web/src/app/api/lia/chat/prompt-base.service.ts`

Revisar:

- identidad
- capacidades
- límites de alcance
- tono
- formato

## 17.2 Línea 2: Conocimiento de producto

Archivos foco:

- `apps/web/src/app/api/lia/chat/prompt-base.service.ts`

Revisar:

- `GLOBAL_UI_CONTEXT`
- descripciones de páginas
- modales
- glosario
- rutas válidas y obsoletas

## 17.3 Línea 3: Contextualización dinámica

Archivos foco:

- `prompt-context.service.ts`
- `platform-context.service.ts`
- `chat-context.builder.ts`

Revisar:

- qué contexto se inyecta
- si falta contexto útil
- si hay contradicciones
- si hay demasiado ruido

## 17.4 Línea 4: Instrucciones situacionales

Archivos foco:

- `prompt-instructions.service.ts`

Revisar:

- instrucciones por tab
- instrucciones por lección
- instrucciones por business page

## 17.5 Línea 5: Seguridad

Archivos foco:

- `route.ts`
- `prompt-injection-detector`
- `context-sanitizer`

Revisar:

- prompt leak
- jailbreak
- data exposure
- reescritura de respuestas

## 17.6 Línea 6: Reporte de bugs

Archivos foco:

- `prompt-base.service.ts`
- `lia-report-workflow.service.ts`
- `chat-context.builder.ts`

Revisar:

- coherencia entre prompt y workflow
- payload del draft
- confirmación
- adjuntos

## 17.7 Línea 7: Salida final

Archivos foco:

- `route.ts`
- `chat-response.formatter.ts`

Revisar:

- cómo se transforma la respuesta
- qué ve el usuario
- si se pierde intención entre modelo y salida

---

## 18. Riesgos detectados al mirar los prompts

## 18.1 Prompt demasiado grande

Entre:

- prompt base
- glosario UI
- contexto usuario
- contexto de lección
- guardrails

el prompt puede crecer mucho.

Riesgo:

- ruido
- contradicciones
- mantenimiento difícil

## 18.2 Reglas contradictorias

Ya se ven señales de posible contradicción entre:

- rutas prohibidas
- glosario heredado que menciona `/courses/[slug]`

## 18.3 Lógica repartida

El comportamiento está dividido entre:

- prompt
- inyección dinámica
- workflow
- postproceso

Riesgo:

- cambiar un prompt y no cambiar la conducta real

---

## 19. Conclusión

Si lo que realmente interesa es “ver los contenidos del prompt o prompts que hacen que funcione SofLIA”, entonces la respuesta correcta es:

- no existe un único prompt maestro de SofLIA
- existe un **prompt compuesto**

Ese prompt compuesto sale, principalmente, de:

1. `LIA_SYSTEM_PROMPT`
2. `GLOBAL_UI_CONTEXT`
3. `LIA_BUG_REPORT_CONFIRMATION_OVERRIDE`
4. `buildUserContextSection(...)`
5. `buildBusinessRoutesSection(...)`
6. `buildPageInstructionsSection(...)`
7. `buildPersonalizationPrompt(...)`
8. `buildPromptInjectionGuardrailPrompt(...)`
9. `appendBugReportContext(...)`

Y todo eso pasa por esta tubería:

1. sanitización
2. análisis de riesgo
3. construcción de contexto
4. ensamblado del prompt
5. normalización de historial
6. llamada al modelo
7. postproceso
8. respuesta final

La lectura práctica para el equipo es esta:

- si van a rediseñar SofLIA, deben tratarla como **pipeline de prompts + contexto + políticas**, no como un solo texto editable.
