Auditoría Funcional – Panel de Usuario (Consumo de Capacitación)
Alcance
Se realizó una revisión funcional del panel de usuario enfocado en el consumo de contenidos de capacitación, incluyendo reproducción de materiales, actividades de conversación guiada con SofLIA y gestión de notas.

Problemas / Errores
1. Respuestas incompletas en Conversación Guiada con SofLIA
Descripción
Durante el primer intento de la actividad de Conversación Guiada con SofLIA, se realizaron 8 interacciones consecutivas entre usuario e IA.
En ninguna de estas interacciones la respuesta de SofLIA se generó de manera completa. Todas las respuestas quedaron truncadas, incompletas o sin un cierre adecuado.
Comportamiento observado
La actividad inicia correctamente.
El usuario responde a las preguntas planteadas.
Las respuestas generadas por la IA aparecen incompletas.
A pesar de ello, el sistema sí genera una retroalimentación final.
Resultado obtenido
Retroalimentación final generada correctamente.
Calificación final mostrada: 35%.
Impacto
La conversación pierde continuidad.
Se dificulta el aprendizaje guiado.
Existe una desconexión entre la interacción realizada y la evaluación final emitida.
Prioridad sugerida
Alta.

2. Error de evaluación que bloquea nuevos intentos
Descripción
Durante un segundo intento de la actividad de Conversación Guiada con SofLIA se presentó el error:
"DIALOGUE_EVALUATION_FAILED"
Comportamiento observado
La evaluación falla durante la ejecución.
El sistema no ofrece mecanismos de recuperación.
No es posible realizar nuevos intentos después del fallo.
Impacto
Bloqueo total de la actividad.
Imposibilidad de continuar el proceso de aprendizaje.
Riesgo de abandono de la capacitación por parte del usuario.
Prioridad sugerida
Crítica.

Observaciones
1. Mejora significativa del sistema de audio
Descripción
La funcionalidad de lectura en audio presenta una mejora notable respecto a revisiones anteriores.
Resultado observado
El audio se reproduce correctamente.
No se detectaron cortes, errores de reproducción o fallos de activación.
La funcionalidad puede considerarse actualmente operativa.
Impacto positivo
Mejora la accesibilidad.
Facilita el consumo del contenido.
Incrementa la calidad general de la experiencia de aprendizaje.

2. El formato avanzado de notas no se conserva después de guardar
Descripción
La funcionalidad de notas permite crear, editar y guardar contenido textual correctamente. Sin embargo, los cambios de formato visual aplicados manualmente no permanecen después del guardado.
Elementos afectados
Negritas.
Cursivas.
Subrayado.
Inserción de enlaces.
Alineación de texto.
Viñetas.
Listas numeradas.
Comportamiento observado
El usuario puede aplicar el formato desde el editor.
La nota se guarda sin errores visibles.
Al reabrir la nota, el formato aplicado desaparece.
Funcionalidades que sí operan correctamente
Creación de notas.
Guardado de notas.
Edición del contenido.
Reescritura y modificación del texto.
Impacto
No afecta la funcionalidad principal de toma de notas.
Limita la organización visual de la información.
Reduce las posibilidades de generar apuntes estructurados.
Prioridad sugerida
Media-Baja.

Resumen Ejecutivo
Aspectos positivos
El sistema de audio se encuentra completamente funcional.
La gestión básica de notas funciona correctamente.
La edición y almacenamiento del contenido textual opera de manera estable.
Aspectos a corregir
Resolver la generación incompleta de respuestas en Conversaciones Guiadas con SofLIA.
Corregir el error "DIALOGUE_EVALUATION_FAILED" y habilitar mecanismos de recuperación y reintento.
Revisar la persistencia del formato enriquecido dentro del módulo de notas.
Evaluación general del módulo auditado
El flujo principal de consumo de contenido funciona adecuadamente. Sin embargo, los problemas detectados en las actividades de Conversación Guiada con SofLIA representan actualmente el principal riesgo funcional del módulo, debido a que afectan directamente la experiencia de aprendizaje y pueden bloquear completamente la realización de actividades.


Link del proceso: https://chatgpt.com/share/6a2446a8-bc30-83e8-a84b-14095ea33b20
