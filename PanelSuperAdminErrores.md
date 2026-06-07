📊 REPORTE DE AUDITORÍA PARCIAL
Plataforma: SofLIA Learning LMS
Módulo: Panel de SuperAdmin
Fecha: 06 de junio de 2026
Alcance: Analytics, Usuarios, Empresas, Dashboard

🔴 HALLAZGOS CRÍTICOS / ALTOS

H1. Analytics sin conteo de tokens (métricas IA en cero)
Módulo: SofLIA Analytics
Severidad: Alta
Problema
El sistema muestra actividad real:
conversaciones
mensajes
usuarios activos
distribución por contexto
Pero todas las métricas de IA están en 0:
tokens consumidos
tokens por modelo
costos
proyección mensual
eficiencia por mensaje
Impacto
Imposible calcular costos reales
Imposible medir uso de IA
Dashboard pierde valor operativo financiero

H2. Horas de estudio en 0 para todos los cursos
Módulo: Estadísticas de Usuarios
Severidad: Alta
Problema
Todos los cursos muestran:
0 horas de estudio
incluso cursos completados
incluso con certificados emitidos
Pero sí existen:
progreso (%)
lecciones completadas
certificaciones
Impacto
Métrica crítica de aprendizaje completamente inválida
rompe analítica educativa

H3. VALIDATION_ERROR al crear empresas + falta de feedback
Módulo: Empresas
Severidad: Alta
Problemas
Error genérico:
“VALIDATION_ERROR” sin explicación
No indica:
campos faltantes
errores en owner
ni validación específica
Botón “Actualizar”:
no tiene feedback visual
no confirma acción
Impacto
bloqueo de creación de organizaciones
UX incomprensible en flujo B2B

H4. Inconsistencia en métricas de usuarios (tiempo vs progreso)
Módulo: Estadísticas de Usuarios
Severidad: Alta
Problema
progreso sí funciona
certificados sí funcionan
lecciones sí funcionan
pero tiempo de estudio = 0
Además:
métricas de rachas no coherentes con progreso visible
Impacto
analítica educativa fragmentada
métricas no confiables

🟠 HALLAZGOS MEDIOS

H5. Inconsistencias en edición de empresas (persistencia de tema)
Módulo: Empresas
Severidad: Media
Problemas
cambio de tema funciona una vez
luego no permite revertir
guardado inconsistente

H6. Problema de contraste visual en logos
Módulo: Empresas / UI
Severidad: Media
Problema
logos no contrastan en modo oscuro
pérdida de legibilidad visual

H7. Componentes legacy o no funcionales en estadísticas
Módulo: Estadísticas de Usuarios
Severidad: Media
Problema
aparece “Sesiones planificadas”
parece módulo desactivado o legacy
widgets sin datos sin claridad de estado

🟡 HALLAZGOS BAJOS / UX

H8. Falta de estados claros en botones y acciones
Módulo: General UI
Severidad: Baja
Problema
botones sin loading
sin confirmación visual
sin feedback de actualización
Ejemplo:
“Actualizar” en Empresas
acciones sin respuesta visual clara

📌 CONCLUSIÓN GENERAL
El sistema presenta un patrón consistente:
1. Analytics parcialmente implementado
progreso funciona
actividad funciona
pero tiempo y tokens no
2. Problema de sincronización de datos
UI muestra estructuras completas
backend no alimenta todas las métricas
3. Problema fuerte de UX de feedback
acciones sin confirmación
errores genéricos sin detalle

🚨 RESUMEN EJECUTIVO
4 problemas críticos en analítica y datos
1 problema crítico en creación de empresas
inconsistencias estructurales en métricas educativas
UX incompleta en acciones administrativas


Link:  https://chatgpt.com/share/6a2473fc-a03c-83e8-b930-fd92dc415ef8
