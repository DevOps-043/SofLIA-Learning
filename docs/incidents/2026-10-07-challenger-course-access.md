# Acceso y asignación del curso Challenger

Fecha: 7 de octubre de 2026.
Cuenta reportada: `diana.coto@soflia.ai`.
Curso: Método Challenger en Ventas B2B (`Challenger-sale`).

## Diagnóstico

La cuenta tiene una inscripción activa y una asignación directa al curso en la organización `pulsehub`, donde es administradora. En otra organización tiene rol de miembro. No es necesario cambiar sus permisos ni volver a inscribirla.

El GET que alimentaba las etiquetas del modal utilizaba el cliente sujeto a RLS, mientras que el POST de asignación consultaba con el cliente de servidor privilegiado. Esto permitía mostrar solamente la asignación del administrador conectado, aunque la validación del POST detectara también la de Diana. El GET además excluía asignaciones con estado nulo que el POST sí consideraba existentes y podía devolver éxito con resultados parciales cuando una consulta fallaba.

El modal mostraba el campo técnico `error` de la respuesta API y descartaba su campo `message`. Por ello aparecía `COURSE_ALREADY_ASSIGNED`.

La comprobación de acceso también utilizaba un cliente sujeto a RLS aunque `SessionService` reconociera una sesión heredada sin JWT de Supabase. Los errores de consulta se convertían en una respuesta negativa de acceso. La hidratación de una organización guardada y las respuestas pendientes de una organización anterior podían producir verificaciones con un contexto incorrecto.

Los contadores de algunos cursos provenían de `courses.student_count`, un dato desactualizado. Se comprobaron 3 inscripciones en Challenger dentro de la organización de Diana y 16 en toda la plataforma.

## Corrección

- El catálogo y la lista de asignaciones validan el rol de administrador de la organización antes de utilizar el cliente de servidor, y mantienen el filtro de organización.
- El listado reconoce las mismas asignaciones directas que el POST y deja de devolver listas parciales como si fueran completas.
- Diana recibe la misma etiqueta «Clic para quitar» que los demás usuarios con asignación directa. El modal espera a cargar las asignaciones y las recarga cuando una operación falla.
- Se muestra el mensaje legible de la API, con una indicación de cómo quitar una asignación directa. Los códigos internos no se presentan como texto al usuario.
- La comprobación de acceso reconoce las inscripciones activas/completadas del usuario autenticado y verifica su membresía activa. No cambia a otra organización cuando la petición especifica una.
- El aprendizaje espera a que la organización guardada coincida con la ruta; se descartan respuestas pendientes de contextos anteriores.
- Los conteos se calculan en PostgreSQL, incluyen estudiantes que completaron el curso y no dependen del límite de filas de las inscripciones.

## Validación

- 65 pruebas de regresión aprobadas: asignaciones visibles, remoción desde el modal, mensajes legibles, recarga por asignaciones concurrentes, permisos, contexto organizacional, espera de la organización al abrir el aprendizaje, acceso con sesiones heredadas y conteos.
- ESLint de los archivos modificados aprobado con la configuración de `apps/web`.
- Consultas de solo lectura a la base configurada: Diana asignada e inscrita; 3 asignaciones e inscripciones en su organización; 4 módulos y 18 lecciones publicadas.
- La comprobación global de TypeScript presenta 302 diagnósticos tanto en HEAD como con estos cambios, sin diagnósticos nuevos. La comparación se guarda en `output/course-incident/typecheck-comparison.json`.

Los cambios son locales y requieren despliegue. La validación no revocó asignaciones, no modificó inscripciones y no restableció progreso.

## Comprobación tras desplegar

Abrir el modal de Challenger en `pulsehub`. Diana debe aparecer con «Clic para quitar», igual que Israel, y no estar disponible para una nueva asignación. Si otro administrador asigna el curso mientras la ventana está abierta, confirmar debe mostrar un mensaje legible y actualizar las etiquetas. La cuenta de Diana debe poder acceder al curso dentro de `pulsehub`.

## Referencia de permisos

Se revisó la [documentación de RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security): el cliente privilegiado permanece en el servidor; las rutas comprueban sesión, rol y organización antes de consultar datos.
