# Plan de mejora: evaluacion de quizzes en SofLIA Learning

## 1. Entendimiento del objetivo

La plataforma no debe ser responsable de inventar o corregir respuestas correctas mal generadas en origen. Esa responsabilidad pertenece a Course Engine/Course Gen.

La responsabilidad de SofLIA Learning es evaluar de forma confiable, auditable y consistente el quiz publicado, evitando que desalineaciones de formato, cache o serializacion produzcan una experiencia arbitraria para el usuario.

## 2. Diagnostico tecnico

El riesgo actual es que la evaluacion puede depender de representaciones distintas del mismo quiz:

- Payload renderizado en cliente.
- Payload persistido en `lesson_materials.content_data` o `lesson_activities.activity_content`.
- Valores generados/importados por Course Engine/Course Gen.
- Valores normalizados por frontend antes de enviar el intento.
- Estado persistido en `user_quiz_submissions` y `user_lesson_progress`.

Esto puede generar drift entre lo que el usuario ve, lo que SofLIA explica y lo que el backend valida.

El punto critico de plataforma es que el endpoint de submit no deberia confiar en `quizData` enviado por cliente como fuente de verdad para calificar. El backend debe evaluar contra la definicion canonica publicada en base de datos.

## 3. Plan de implementacion

### Fase 1: fuente canonica de evaluacion

- Cambiar el submit de quiz para recibir solo `answers`, `materialId` o `activityId`, y contexto minimo.
- Cargar la definicion canonica del quiz desde base de datos.
- Validar que el recurso pertenece a la leccion solicitada.
- Evaluar en backend contra esa definicion canonica.
- Mantener compatibilidad temporal con payloads legacy solo como fallback controlado y observable.

### Fase 2: servicio unico de evaluacion

- Extraer la logica de evaluacion a un servicio puro y testeable.
- Centralizar normalizacion de:
  - Verdadero/Falso.
  - Indices numericos.
  - Labels visuales.
  - `correctAnswer` y `correct_answer`.
  - Respuestas string normalizadas.
- Reducir duplicacion entre frontend y backend.

### Fase 3: validacion y auditoria de contenido

- Agregar una validacion server-side antes de guardar o publicar quizzes.
- Detectar preguntas invalidas o ambiguas:
  - Verdadero/Falso sin dos opciones validas.
  - Respuesta correcta fuera de las opciones.
  - `correctAnswer` vacio.
  - `correct_answer` legacy coexistiendo con `correctAnswer`.
  - Booleanos o indices no normalizados.
- Generar mensajes accionables para Super Admin.

### Fase 4: observabilidad

- Loggear inconsistencias de evaluacion con datos no sensibles:
  - `materialId` o `activityId`.
  - `lessonId`.
  - `questionId`.
  - `questionType`.
  - tipo de `correctAnswer`.
  - tipo de respuesta del usuario.
- Evitar registrar respuestas libres completas del usuario.
- Agregar metricas de quizzes con configuracion invalida o intentos rechazados por contrato.

## 4. Alcance dentro de SofLIA Learning

SofLIA Learning si debe:

- Evaluar contra el contenido canonico publicado.
- Normalizar formatos legacy de forma segura.
- Rechazar o marcar configuraciones ambiguas.
- Mostrar errores claros al Admin cuando una pregunta no es valida.
- Mantener compatibilidad temporal con contenido existente.
- Tener pruebas unitarias e integracion para Verdadero/Falso.
- Proteger la continuidad academica del usuario cuando el fallo sea tecnico.

SofLIA Learning no debe:

- Decidir semanticamente cual respuesta era correcta si el origen genero mal el quiz.
- Modificar automaticamente contenido academico sin trazabilidad.
- Sobrescribir respuestas correctas con heuristicas silenciosas.
- Convertirse en el editor principal de verdad academica generada por Course Engine/Course Gen.

## 5. Pruebas requeridas

Casos unitarios:

- `true_false` con `correctAnswer: "Verdadero"`.
- `true_false` con `correctAnswer: "Falso"`.
- `true_false` con `correctAnswer: true`.
- `true_false` con `correctAnswer: false`.
- `true_false` con `correctAnswer: 0` y `1`.
- `correct_answer` legacy.
- Opciones invertidas o labels en ingles.
- Respuesta seleccionada como indice y como texto.

Casos de integracion:

- Submit de quiz material.
- Submit de quiz activity.
- Reintento despues de reprobar.
- Aprobacion desbloqueando avance de leccion.
- Estado `/quiz/status` consistente con `user_quiz_submissions`.

## 6. Riesgos y validaciones

Riesgos:

- Contenido legacy puede depender de formatos inconsistentes.
- Cambiar la evaluacion puede revelar quizzes ya publicados con configuracion defectuosa.
- Si se corrige demasiado agresivamente en plataforma, se oculta el problema de origen.

Validaciones:

- Ejecutar auditoria sobre quizzes publicados antes de activar enforcement estricto.
- Aplicar rollout gradual: warning, luego bloqueo de publicacion para nuevos quizzes.
- Documentar excepciones legacy y fecha objetivo de saneamiento.

