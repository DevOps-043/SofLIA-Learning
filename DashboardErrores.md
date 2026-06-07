
📊 ResumenDE AUDITORÍA — PLATAFORMA SOFLIA
1. Resumen ejecutivo
Se realizó una auditoría funcional y de experiencia de usuario sobre la plataforma SofLIA, cubriendo módulos de:
Notificaciones
SofLIA (voz y chat)
Estadísticas
Certificados
Perfil de usuario
Libro de apuntes
Cursos y dashboard general
Resultados generales:
Total de errores críticos/funcionales: 6
Total de observaciones UX / producto: 6
Problemas principales detectados:
Inconsistencias de datos entre módulos
Fallos en flujos de seguridad (contraseña, email)
Problemas en funcionalidades de acción (copiar, compartir, voz)
Errores en generación/exportación (PDF y notas)
Falta de claridad en estados del sistema

2. Distribución general
Tipo
Cantidad
Errores
6
Observaciones
6
Total hallazgos
12


3. ERRORES DETECTADOS

ERR-001 — Fallo en activación de voz en vivo
Módulo: SofLIA / Voz
Severidad: Alta
No permite iniciar voz en vivo pese a tener micrófono funcional.

ERR-002 — Fallo en “Compartir certificado”
Módulo: Certificados
Flujo de compartir no ejecuta acción real.

ERR-003 — Desalineación en PDF de certificado
Módulo: Certificados
Elemento gráfico se sobrepone al nombre en PDF descargado.

ERR-004 — Editor de notas muestra HTML crudo
Módulo: Libro de apuntes
El contenido aparece como código en lugar de texto editable.

ERR-005 — Apunte SofLIA no permite copiar ni duplicar
Módulo: Libro de apuntes
Acciones de copiar y duplicar no funcionan o no generan resultado.

ERR-006 — Inconsistencia en perfil de seguridad (email)
Módulo: Perfil
Estado “email verificado” sin correo visible o coherente.

ERR-007 — Inconsistencia de datos entre módulos
Módulo: Perfil / Estadísticas / Certificados
Lecciones, certificados y progreso no coinciden entre vistas.

ERR-008 — Error al cambiar contraseña
Módulo: Perfil / Seguridad
Validación OK pero backend falla con error genérico.

4. OBSERVACIONES UX / PRODUCTO

OBS-001 — Notificaciones de inicio de sesión poco claras
No queda claro si son del usuario actual o del sistema.

OBS-002 — Evaluación del valor de voz de SofLIA
Funciona bien, pero se cuestiona su utilidad vs texto.

OBS-003 — Problemas de pronunciación en voz
Errores menores en pronunciación y pausas excesivas.

OBS-004 — Pruebas de límites del modelo IA
Respuesta adecuada ante preguntas fuera de contexto.

OBS-005 — Mapa de actividad sin explicación clara
Falta interpretación de colores y alcance de datos.

OBS-006 — No es posible eliminar foto de perfil
Solo permite cambiar, no eliminar o resetear.

5. HALLAZGOS CRÍTICOS (prioridad alta)
Estos requieren atención inmediata:
ERR-001 → Voz en vivo no funcional
ERR-007 → Inconsistencia de datos global
ERR-008 → Cambio de contraseña fallando

6. PROBLEMAS ESTRUCTURALES DETECTADOS
Se identifican 3 problemas sistémicos:
1. Inconsistencia de datos
Estadísticas vs certificados vs perfil no coinciden
2. Flujos incompletos
Compartir, copiar, duplicar, voz, contraseña
3. Falta de feedback al usuario
Acciones sin confirmación o sin error claro

7. RECOMENDACIONES PRIORITARIAS
Prioridad alta
Revisar backend de seguridad (password/email)
Revisar sistema de sincronización de datos (analytics)
Revisar sistema de voz (WebRTC / permisos / sesión)
Prioridad media
Corregir exportación PDF
Corregir acciones en certificados
Mejorar editor de notas
Prioridad baja
UX de estadísticas
Personalización de perfil
Mejora de voz (pronunciación)

8. CONCLUSIÓN GENERAL
La plataforma SofLIA muestra:
✔ Buen nivel de funcionalidad general
✔ UX visual consistente en dashboards
✔ Buen comportamiento de IA en contexto educativo
Pero también presenta:
❌ Problemas de consistencia de datos entre módulos
❌ Flujos críticos incompletos (seguridad, voz, acciones)
❌ Errores de integración backend-frontend
❌ Falta de feedback en acciones del usuario

Auditoria con explicación más completa y profunda:
https://chatgpt.com/share/6a234958-8304-83e8-83b6-2d400b1f810f

