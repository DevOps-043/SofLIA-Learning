# Investigación Profunda de SofLIA

## 1. Propósito de este documento

Este documento consolida el comportamiento actual de **SofLIA** a partir de:

- `prompt_maestro.md` como **fuente de verdad metodológica** para el análisis
- los prompts operativos reales del agente
- la implementación técnica encontrada en `apps/web/src/app/api/lia`, `apps/web/src/app/api/ai-chat` y módulos relacionados
- documentación interna del flujo LIA y del planificador

Importante:

- `prompt_maestro.md` **no define directamente la personalidad ni el comportamiento conversacional de SofLIA**.
- Sí define el **marco de calidad** con el que conviene evaluar cambios: correctitud, seguridad, mantenibilidad, modularidad, testabilidad y observabilidad.
- El comportamiento real de SofLIA hoy está repartido entre **prompt base**, **inyección de contexto**, **rutas API**, **guardrails de seguridad**, **persistencia**, **personalización** y **heurísticas codificadas**.

---

## 2. Resumen ejecutivo

SofLIA no es solo un prompt. Es un sistema híbrido con estas capas:

1. **Identidad y reglas base** del asistente.
2. **Contexto dinámico** de usuario, organización, página, curso y progreso.
3. **Instrucciones por entorno** según dónde esté navegando el usuario.
4. **Lógica técnica codificada** para seguridad, historial, reportes, personalización y planificación.
5. **Heurísticas y algoritmos** para sugerencias de estudio y deadlines.
6. **Múltiples endpoints**, algunos más modernos y otros legados/paralelos.

Conclusión principal:

- Para cambiar “el agente SofLIA” no alcanza con editar un solo prompt.
- Hay que intervenir al menos en:
  - prompt base
  - composición de contexto
  - restricciones de seguridad
  - endpoints específicos de chat
  - módulos heurísticos
  - flujos de persistencia y reportes

---

## 3. Qué aporta `prompt_maestro.md`

`prompt_maestro.md` actúa como una guía de ingeniería senior, no como el prompt funcional de SofLIA.

### 3.1 Lo que sí define

- orden de prioridades:
  1. correctitud funcional
  2. seguridad
  3. legibilidad
  4. mantenibilidad
  5. modularidad
  6. escalabilidad
  7. performance
  8. testabilidad
  9. observabilidad
  10. documentación clara
- reglas de desarrollo:
  - no lógica espagueti
  - no mezclar responsabilidades
  - no hardcodear sin justificación
  - no asumir seguridad ni escalabilidad
  - no entregar sin validación
- criterios estructurales:
  - separación clara de capas
  - manejo explícito de errores
  - contratos claros
  - diseño testeable y modular

### 3.2 Lo que no define

- identidad de SofLIA
- tono conversacional de SofLIA
- rutas que puede mencionar
- cómo responde preguntas de plataforma
- cómo reporta bugs
- cómo decide qué proveedor IA usar
- cómo construye contexto de usuario/curso/organización

Por eso, `prompt_maestro.md` debe tomarse como **marco rector para rediseñar SofLIA**, no como su especificación funcional actual.

---

## 4. Arquitectura real de SofLIA

## 4.1 Dónde vive realmente la lógica

Aunque existe `apps/api`, el documento `apps/api/ARCHITECTURE.md` deja claro que la lógica de negocio vive principalmente en:

- `apps/web/src/app/api/...`

En particular, SofLIA aparece repartida en:

- `apps/web/src/app/api/lia/...`
- `apps/web/src/app/api/ai-chat/...`
- `apps/web/src/app/api/study-planner-chat/route.ts`

### 4.2 Lectura arquitectónica

Hay al menos **dos generaciones** de chat/agent behavior:

- una capa más nueva y específica bajo `/api/lia/...`
- una capa más general/legacy bajo `/api/ai-chat/...`

Esto es importante porque cualquier cambio puede requerir decidir si:

- se consolida todo en `/api/lia`
- se mantiene compatibilidad dual
- o se elimina una de las rutas de forma controlada

---

## 5. Identidad operacional de SofLIA

La identidad base del agente está en:

- `apps/web/src/app/api/lia/chat/prompt-base.service.ts`

### 5.1 Identidad declarada

SofLIA se define como:

- **Learning Intelligence Assistant**
- asistente de IA de la plataforma SofLIA
- profesional, amigable, proactiva y motivadora
- multilingüe: español, inglés y portugués

### 5.2 Capacidades declaradas

- gestión de cursos
- orientación educativa
- productividad y estudio
- asistencia general sobre la plataforma
- analíticas de progreso
- reporte guiado de errores

### 5.3 Restricción central de alcance

La regla más fuerte es esta:

- SofLIA debe responder **únicamente** sobre contenido y funcionalidades de la plataforma.

Puede responder sobre:

- cursos, lecciones, módulos, contenido educativo
- navegación de la plataforma
- progreso
- recomendaciones basadas en contenido disponible
- ayuda con ejercicios

No debe responder sobre:

- cultura general ajena a la plataforma
- entretenimiento
- deportes
- celebridades
- temas fuera del dominio SofLIA

Esto convierte a SofLIA en un agente **fuertemente acotado por dominio**.

---

## 6. Cómo se arma el prompt real

El prompt final no sale de un archivo único. Se compone en capas:

### 6.1 Capa base

Archivo:

- `apps/web/src/app/api/lia/chat/prompt-base.service.ts`

Contiene:

- identidad
- alcance
- reglas de formato
- reglas de seguridad
- glosario UI global
- reglas de rutas
- reglas para reporte de bugs

### 6.2 Capa de contexto de usuario

Archivo:

- `apps/web/src/app/api/lia/chat/prompt-context.service.ts`

Añade dinámicamente:

- usuario activo
- organización
- slug organizacional
- cargo profesional
- página actual
- estadísticas generales
- cursos inscritos
- progreso de lecciones
- cursos asignados visibles

Esto hace que el agente responda con contexto real y no solo con lenguaje general.

### 6.3 Capa de instrucciones por página/ruta

Archivo:

- `apps/web/src/app/api/lia/chat/prompt-instructions.service.ts`

Aquí se ajusta el comportamiento según:

- business panel
- business user
- contexto de página
- lección o actividad actual

### 6.4 Orquestación final

Archivo:

- `apps/web/src/app/api/lia/chat/system-prompt.service.ts`

Este módulo:

- toma el prompt base
- inyecta contexto business
- agrega override para flujo de bugs
- reescribe rutas con `organizationSlug`
- agrega contexto actual verificado

Resultado:

- el “prompt de SofLIA” es en realidad un **prompt ensamblado**.

---

## 7. Comportamiento técnico del endpoint principal `/api/lia/chat`

Archivo principal:

- `apps/web/src/app/api/lia/chat/route.ts`

### 7.1 Flujo de ejecución

1. recibe mensajes y contexto
2. sanitiza entrada
3. evalúa riesgo de prompt injection
4. resuelve contexto organizacional activo
5. construye contexto de plataforma
6. genera system prompt ensamblado
7. agrega personalización si existe
8. maneja flujo de bug report si aplica
9. llama a Gemini
10. postprocesa respuesta
11. aplica política de seguridad de salida
12. responde en JSON o streaming SSE

### 7.2 Proveedor IA

El endpoint `/api/lia/chat` usa:

- `@google/generative-ai`
- modelo por default:
  - `gemini-2.0-flash-exp`
- configurable por:
  - `GEMINI_MODEL`

Configuración relevante:

- `temperature: 0.7`
- `maxOutputTokens: 8192`
- safety thresholds del proveedor en `BLOCK_NONE`

Eso significa que la moderación fuerte no depende del proveedor, sino de:

- sanitización previa
- detector de prompt injection
- reescritura/filtrado posterior

### 7.3 Seguridad aplicada

El endpoint protege el flujo con:

- `sanitizeUntrustedString`
- `sanitizeContextPayload`
- `evaluatePromptInjectionRisk`
- `buildPromptInjectionGuardrailPrompt`
- `enforceSecurityResponsePolicy`
- `recordSecurityEvent`

Esto es una diferencia importante frente a un “prompt-only agent”:

- aquí parte del comportamiento de seguridad está **codificado**, no delegado al LLM.

---

## 8. Persistencia, memoria y trazabilidad

Archivo:

- `apps/web/src/app/api/lia/chat/lia-chat-history.service.ts`

### 8.1 Qué persiste

SofLIA guarda:

- conversaciones en `lia_conversations`
- mensajes en `lia_messages`

### 8.2 Qué valida

- `conversationId` debe ser UUID válido
- se requiere `userId`
- persiste turno usuario + asistente

### 8.3 Observación importante

En el guardado aparece hardcodeado:

- `model_used: 'gemini-1.5-flash'`

pero el endpoint principal usa por default:

- `gemini-2.0-flash-exp`

Esto genera una **inconsistencia de trazabilidad**:

- la respuesta puede venir de un modelo, pero el historial reporta otro.

Desde el criterio de `prompt_maestro.md`, esto es un problema de:

- correctitud
- observabilidad
- auditoría técnica

---

## 9. Reporte de bugs: no es solo texto, es workflow

Archivos clave:

- `apps/web/src/app/api/lia/chat/prompt-base.service.ts`
- `apps/web/src/app/api/lia/chat/lia-report-workflow.service.ts`

### 9.1 Diseño funcional

SofLIA puede recibir reportes desde chat.

El prompt base instruye a:

- empatizar
- reportar directamente
- generar un bloque oculto `[[BUG_REPORT:...]]`

Pero luego existe un override:

- `LIA_BUG_REPORT_CONFIRMATION_OVERRIDE`

que reemplaza ese comportamiento por uno más seguro:

- primero genera borrador técnico visible
- pide confirmación explícita
- mientras no haya confirmación usa `[[BUG_REPORT_DRAFT:...]]`
- solo luego se envía el reporte real

### 9.2 Qué añade la capa técnica

La implementación del workflow agrega:

- contexto de página
- contexto de curso/lección
- adjuntos
- metadata del navegador
- resolución de pantalla
- errores recientes
- snapshot de sesión
- grabación si existe

Esto confirma que el flujo de bugs es **sistémico**, no solo una instrucción de prompt.

---

## 10. Personalización del agente

Archivo:

- `apps/web/src/app/api/lia/personalization/route.ts`

### 10.1 Qué puede personalizarse

- `base_style`
- `is_friendly`
- `is_enthusiastic`
- `custom_instructions`
- `nickname`
- `voice_enabled`
- `dictation_enabled`

### 10.2 Restricción importante

El propio prompt base deja explícito que:

- la personalización solo puede alterar **tono y estilo**
- no puede ampliar el **alcance funcional**

### 10.3 Protección aplicada

Las `custom_instructions` se sanitizan contra patrones típicos de prompt injection:

- `ignore previous instructions`
- `override`
- `system prompt`
- `you are now`
- etc.

No se bloquea todo, pero sí se limpia el contenido riesgoso.

---

## 11. Contexto de plataforma y comportamiento dependiente de datos

Archivo clave:

- `apps/web/src/app/api/lia/chat/platform-context.service.ts`

Aunque no se leyó completo, su uso y tipos muestran que SofLIA puede contextualizar con:

- cursos del usuario
- progreso de lecciones
- actividades
- materiales
- cursos con contenido
- organización activa
- página actual
- lección actual
- adjuntos visuales

Esto implica que gran parte del comportamiento depende de **datos vivos de Supabase**, no solo del prompt textual.

En otras palabras:

- sin contexto, SofLIA es un asistente acotado
- con contexto, SofLIA se convierte en un asistente situado dentro del producto

---

## 12. Flujo alterno `/api/ai-chat`: capa legacy o paralela

Archivos clave:

- `apps/web/src/app/api/ai-chat/route.ts`
- `apps/web/src/app/api/ai-chat/system-prompt.service.ts`
- `apps/web/src/app/api/ai-chat/ai-provider.service.ts`

### 12.1 Qué hace esta ruta

`/api/ai-chat` implementa otra experiencia de chat con:

- rate limiting propio
- normalización de request
- detección de idioma
- armado de contexto
- analytics
- historial
- proveedor IA adaptable

### 12.2 Selección de proveedor

`generateAiChatResponse` decide entre:

- Gemini
- OpenAI
- fallback local

Según el contexto, Gemini se usa para:

- `study-planner`
- `study-planner-availability`
- `general`
- `course`
- `workshops`

Si falla el proveedor, cae a:

- `generateAIResponse(...)`

Esto sugiere que el sistema no depende de un único backend de IA.

### 12.3 Diferencia filosófica con `/api/lia/chat`

`/api/lia/chat` parece más centrado en:

- SofLIA como agente de plataforma
- seguridad contextual
- reporte de bugs
- contexto organizacional

`/api/ai-chat` parece más centrado en:

- compatibilidad de contextos
- selección de proveedor
- endpoint generalista
- flujos antiguos o transversales

---

## 13. Study Planner: comportamiento algorítmico y no solo conversacional

Hay dos capas:

- backend CRUD del planificador
- chat específico del planificador

### 13.1 Backend del planificador

Archivos:

- `apps/api/src/features/study-planner/...`

Implementa:

- planes
- sesiones
- validaciones con Zod
- persistencia en Supabase
- paginación
- filtros
- ownership por usuario

Esto no es “IA”; es lógica estructural del producto.

### 13.2 Chat del planificador

Archivo:

- `apps/web/src/app/api/study-planner-chat/route.ts`

Características:

- endpoint separado del chat general
- usa Gemini directamente
- recibe `systemPrompt` desde el cliente
- diseñado para interacciones específicas de planificación

La propia cabecera del archivo aclara algo delicado:

- “sin filtros de prompt-leak”

Eso vuelve esta ruta especialmente sensible si se planea refactorizar seguridad del agente.

### 13.3 Heurísticas del planificador

Archivo:

- `apps/web/src/app/api/ai-chat/services/study-schedule.service.ts`

Aquí hay comportamiento puramente algorítmico:

- detección de solicitud de cambio de horario por regex
- extracción de hora propuesta
- detección de días y franjas horarias por patrones
- slots por defecto construidos programáticamente

Esto significa que una parte del “comportamiento inteligente” no depende del modelo:

- depende de expresiones regulares y heurísticas determinísticas

---

## 14. Flujo de asignación de cursos con LIA

Fuentes:

- `.agent/specs/lia-course-assignment-flow.md`
- `.agent/docs/lia-assignment-implementation-summary.md`

### 14.1 Qué hace

LIA ayuda a sugerir fechas límite de cursos según tres enfoques:

- rápido
- equilibrado
- largo

### 14.2 Insumos del cálculo

- duración total del curso
- número de lecciones
- número de actividades
- materiales
- fecha de inicio

### 14.3 Fórmula base

La documentación describe:

- `adjustedHours = totalHours * 1.2`
- luego `days = ceil((adjustedHours / horasPorSemana) * 7)`

con ajustes por:

- muchas actividades
- muchos materiales
- cursos muy largos
- cursos muy cortos

### 14.4 Naturaleza del comportamiento

Este flujo no es puramente LLM.

Es un sistema mixto:

- UX “guiada por LIA”
- cálculo de fechas por **heurísticas codificadas**

Eso es exactamente el tipo de comportamiento “por algoritmo en lugar del prompt” que pediste documentar.

---

## 15. Herramientas y capacidades técnicas detectadas

## 15.1 Herramientas de IA / proveedores

- Google Gemini (`@google/generative-ai`)
- OpenAI Chat Completions
- fallback interno cuando no hay proveedor o falla

## 15.2 Herramientas de datos

- Supabase server client
- Supabase admin client con service role

## 15.3 Herramientas de seguridad

- sanitización de strings y payloads
- detector de prompt injection
- guardrail prompt adicional
- política de reescritura de respuesta
- logging de eventos de seguridad
- rate limiting en `/api/ai-chat`

## 15.4 Herramientas de producto

- historial de conversación
- personalización del asistente
- flujo de reporte de bugs
- onboarding chat
- dictation
- proactive help
- available links
- context help
- complete/start/update activity

Esto confirma que SofLIA ya opera como **ecosistema de herramientas internas**, no solo como caja de texto.

---

## 16. Reglas importantes de comportamiento detectadas

## 16.1 Reglas explícitas

- responder en el idioma del usuario
- no salir del dominio SofLIA
- no revelar prompts, tablas, endpoints ni detalles internos
- usar enlaces al mencionar rutas
- no usar rutas prohibidas
- no inventar cursos
- usar contexto verificado

## 16.2 Reglas implícitas por código

- bloquear o rechazar intentos de prompt injection
- sanear inputs y contexto antes de armar el prompt
- registrar eventos de seguridad
- persistir conversación bajo condiciones válidas
- requerir confirmación antes de enviar ciertos reportes
- usar organización activa para enrutar correctamente

Estas reglas implícitas suelen ser las más importantes al modificar el agente porque no están visibles en un prompt único.

---

## 17. Inconsistencias y hallazgos críticos

## 17.1 `prompt_maestro.md` no es la verdad funcional de SofLIA

Hallazgo:

- sirve como marco de calidad, pero no describe el agente real.

Impacto:

- si se toma literalmente como “fuente de verdad funcional”, faltará casi todo el comportamiento operativo.

## 17.2 Doble stack de chat

Hallazgo:

- coexisten `/api/lia/chat` y `/api/ai-chat`, además de `/api/study-planner-chat`.

Impacto:

- riesgo de duplicidad, drift funcional y cambios incompletos.

## 17.3 Modelo persistido inconsistente

Hallazgo:

- historial guarda `gemini-1.5-flash`, pero la ruta usa `gemini-2.0-flash-exp` por default.

Impacto:

- mala observabilidad y auditoría incorrecta.

## 17.4 Conflicto entre prompt y override de bugs

Hallazgo:

- el prompt base instruye `BUG_REPORT`, pero luego un override impone `BUG_REPORT_DRAFT` + confirmación.

Impacto:

- la verdad funcional está en la composición final, no en el prompt base aislado.

## 17.5 Inconsistencias en cifras de LIA deadline suggestions

En documentación aparecen diferencias:

- un documento habla de `6 / 2.5 / 1.5` horas por semana
- otro glosario UI habla de `12 / 4 / 2`

Impacto:

- riesgo de UX inconsistente y expectativas erróneas.

## 17.6 Study Planner expone `systemPrompt` desde cliente

Hallazgo:

- `study-planner-chat` exige `systemPrompt` en el request.

Impacto:

- mayor superficie de riesgo y menor centralización del comportamiento del agente.

## 17.7 Documentación de rutas potencialmente contradictoria

En el prompt global aparecen:

- “Vista de curso `/courses/[slug]`”
- “Reproductor `/courses/[slug]/learn`”

pero en el mismo prompt también aparecen restricciones:

- “NUNCA uses `/courses/[slug]`”

Impacto:

- posible contradicción entre glosario heredado y reglas actuales de navegación.

---

## 18. Mapa de fuentes principales

### 18.1 Fuente metodológica

- `prompt_maestro.md`

### 18.2 Núcleo de SofLIA actual

- `apps/web/src/app/api/lia/chat/route.ts`
- `apps/web/src/app/api/lia/chat/system-prompt.service.ts`
- `apps/web/src/app/api/lia/chat/prompt-base.service.ts`
- `apps/web/src/app/api/lia/chat/prompt-context.service.ts`
- `apps/web/src/app/api/lia/chat/prompt-instructions.service.ts`
- `apps/web/src/app/api/lia/chat/platform-context.service.ts`
- `apps/web/src/app/api/lia/chat/chat-context.builder.ts`

### 18.3 Seguridad

- `lib/security/context-sanitizer`
- `lib/security/prompt-injection-detector`
- `lib/security/security-events`

### 18.4 Persistencia y workflow

- `apps/web/src/app/api/lia/chat/lia-chat-history.service.ts`
- `apps/web/src/app/api/lia/chat/lia-report-workflow.service.ts`
- `apps/web/src/app/api/lia/personalization/route.ts`

### 18.5 Capa paralela / legacy

- `apps/web/src/app/api/ai-chat/route.ts`
- `apps/web/src/app/api/ai-chat/ai-provider.service.ts`
- `apps/web/src/app/api/ai-chat/system-prompt.service.ts`

### 18.6 Algoritmos complementarios

- `apps/web/src/app/api/ai-chat/services/study-schedule.service.ts`
- `.agent/specs/lia-course-assignment-flow.md`
- `.agent/docs/lia-assignment-implementation-summary.md`
- `apps/api/src/features/study-planner/...`

---

## 19. Qué debería considerarse “source of truth” a partir de ahora

Si queremos cambiar SofLIA de forma ordenada, propongo esta jerarquía de verdad:

1. **Comportamiento sistémico real**
   - rutas activas
   - guardrails
   - persistencia
   - personalización
   - heurísticas
2. **Prompt ensamblado final**
   - no solo prompt base
3. **Contrato de contexto**
   - qué datos puede usar el agente
4. **Documentación UX/flows**
5. **`prompt_maestro.md`**
   - como estándar de calidad para rediseño

Si solo se modifica el prompt base, el cambio quedará incompleto.

---

## 20. Recomendaciones para la siguiente fase

## 20.1 Corto plazo

- consolidar en un solo documento técnico el prompt final ensamblado
- decidir qué ruta será la oficial:
  - `/api/lia/chat`
  - `/api/ai-chat`
  - ambas con responsabilidades explícitas
- corregir trazabilidad del modelo persistido
- normalizar cifras del flujo de deadlines
- inventariar rutas y reglas realmente válidas de navegación

## 20.2 Mediano plazo

- separar “identidad del agente” de “reglas de seguridad” y de “conocimiento UI”
- mover documentación heredada contradictoria a módulos versionados
- centralizar configuración de proveedor/modelo
- definir contrato formal del contexto que entra al agente

## 20.3 Ideal

Diseñar SofLIA como 5 capas explícitas:

1. identidad y tono
2. alcance y políticas
3. contexto verificable
4. herramientas/acciones
5. postprocesamiento y seguridad

Eso haría los cambios mucho más seguros y alineados con `prompt_maestro.md`.

---

## 21. Conclusión final

SofLIA hoy es un **agente compuesto**. Su comportamiento no está en un solo prompt, sino en la interacción entre:

- prompts ensamblados
- contexto dinámico
- seguridad codificada
- flujos de negocio
- persistencia
- personalización
- heurísticas algorítmicas

La mejor lectura de `prompt_maestro.md` en este proyecto es:

- no como prompt de SofLIA
- sino como estándar para rediseñarla correctamente

Si vamos a tocar el agente, el cambio debe considerar al menos:

- prompt base
- system prompt assembler
- context builder
- endpoints activos
- seguridad
- workflows de reportes
- heurísticas de planning/deadlines

De lo contrario, el resultado sería parcial y difícil de auditar.
