# Soflia In Live

## Objetivo y alcance

Modalidad síncrona junto a los cursos asíncronos existentes. La sala reutiliza `useCourseTheme`, sustituye el temario por el chat del grupo y mantiene una conversación privada con Soflia. El instructor programa sus cursos importados desde Engine, publica lecturas, quizzes y archivos, y usa los controles de Zoom para audio, vídeo y pantalla.

Rutas: `/{orgSlug}/live`, `/{orgSlug}/live/{sessionId}` y `/{orgSlug}/instructor`. El dashboard del alumno incluye la agenda; el panel de administración enlaza al espacio de instructores. La funcionalidad está deshabilitada por defecto.

## Arquitectura

- `apps/web/src/features/live`: componentes, hooks, contratos y casos de uso del dominio.
- `services/`: programación, catálogo, ciclo de vida, actividades, archivos, respuestas, asistencia e instructores. Los handlers HTTP autentican, validan y despachan.
- `server.ts`: frontera de autorización organizacional y adaptación de errores HTTP. Las mutaciones usan el cliente servidor únicamente después de verificar sesión, membresía activa y alcance del recurso.
- `database.types.ts`: extensión tipada del contrato generado para las tablas nuevas. Regenerar el esquema completo tras aplicar la migración y retirar esta extensión cuando sus tipos estén incorporados.
- `zoom.server.ts`: API Server-to-Server OAuth y firmas del Meeting SDK. Usa timeout y circuit breaker; las creaciones no tienen reintentos automáticos.
- `soflia.server.ts`: gateway de IA existente, contexto reciente obtenido en servidor, sanitización y política contra inyección de instrucciones.
- Migración: `supabase/migrations/20261005162654_live_learning.sql`.

El rol docente es una **capacidad adicional por organización** (`organization_instructors`), independiente de `organization_users.role`. No convierte al instructor en administrador ni modifica los roles globales existentes. Requiere una cuenta empresarial con membresía activa. Administrador/propietario supervisa todos los instructores de su organización y puede otorgarse la capacidad docente; para programar debe ser autor del curso y tener anfitrión Zoom vinculado.

La autoría procede de `courses.instructor_id`, establecido por la importación de Engine. Esta entrega no modifica el protocolo de importación. Una atribución incorrecta en Engine debe corregirse antes de programar.

## Seguridad y consistencia

Las tablas tienen RLS y privilegios explícitos. Realtime solo expone sesiones, mensajes públicos y actividades a miembros activos con curso asignado, instructores responsables o administradores de la misma organización. La función de lectura privada utiliza `auth.uid()` y comprueba usuarios bloqueados; no confía en metadatos editables.

Las contraseñas de Zoom, las claves de quizzes y los chats privados no tienen lectura directa para `authenticated`. La firma de anfitrión y ZAK se entregan exclusivamente al instructor responsable; un administrador que supervisa entra como participante. Los uploads validan tamaño y firma del contenido (PDF, PNG, JPEG, 10 MB), se guardan en bucket privado y se descargan mediante URL firmada de 60 segundos.

La programación reserva una clave UUID de idempotencia antes de llamar a Zoom. Una función SQL guarda sesión, credenciales y resultado de la solicitud en una transacción. Ante una respuesta perdida consulta el resultado antes de compensar. Estados `pending` o `uncertain` no se reintentan automáticamente: soporte debe conciliar con Zoom. La creación de quiz y clave también es atómica. Cada alumno dispone de una sola respuesta por actividad. Triggers bloquean nuevas publicaciones y respuestas cuando la sesión ha terminado.

El webhook valida HMAC sobre el cuerpo original, comparación de tiempo constante, cuenta y una ventana de cinco minutos. Las transiciones condicionales admiten entregas duplicadas sin reabrir sesiones finalizadas.

## Configuración y activación

Variables exclusivamente de servidor:

```dotenv
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_MEETING_SDK_KEY=
ZOOM_MEETING_SDK_SECRET=
ZOOM_WEBHOOK_SECRET_TOKEN=
```

Bandera de compilación frontend y servidor:

```dotenv
NEXT_PUBLIC_LIVE_LEARNING_ENABLED=true
```

1. Aplicar la migración en staging mediante el flujo habitual de Supabase. Fue probada con PostgreSQL embebido; no se aplicó a una base remota durante esta implementación.
2. Configurar la app Server-to-Server OAuth para crear/consultar/modificar/eliminar reuniones y obtener ZAK de los anfitriones autorizados. Configurar el Meeting SDK y dominio permitido. Este adaptador presupone anfitriones pertenecientes a la cuenta Zoom configurada; cuentas externas requieren OAuth por organización, no están implementadas.
3. Registrar `https://<dominio>/api/internal/jobs/zoom-live` como webhook y suscribir `meeting.started`, `meeting.ended`, `meeting.deleted`. La ruta interna verifica el secreto de Zoom en su propio handler. Verificar la validación de URL con Zoom.
4. Habilitar transcripción/subtítulos en Zoom. Solo el navegador del anfitrión transmite segmentos finalizados del evento `caption-message`; no hay un bot ni una conexión RTMS independiente.
5. Verificar la sesión Supabase del navegador: Realtime requiere JWT de Supabase válido además de la sesión empresarial que autoriza la API. Confirmar RLS y la publicación `supabase_realtime` con dos usuarios de organizaciones distintas.
6. Configurar el limitador distribuido existente (Redis o su fallback Supabase en producción). Configurar el proveedor de IA mediante el panel existente.
7. Activar la bandera, recompilar y vincular miembros a sus usuarios Zoom desde el panel de instructor, usando una cuenta owner/admin.
8. Validar el flujo real completo antes de activar producción. Desactivar la bandera y recompilar constituye el rollback de aplicación; conserva los datos. No eliminar tablas ni bucket como rollback automático.

## Contratos HTTP

Todas las respuestas del módulo llevan `Cache-Control: no-store`.

| Método y ruta relativa a `/api/{orgSlug}/live` | Función |
| --- | --- |
| GET `/` | Catálogo y estadísticas; `view=student\|instructor`, `period=all\|upcoming\|past`, `instructor=<uuid>`, `page`, `coursePage`, `instructorPage` (desde 0). Sesiones 20/página, cursos e instructores 50/página. |
| POST `/` | Programa reunión. UUID `request_id`, UUID `course_id`, `title`, `description`, `starts_at` ISO con zona, `duration_minutes` entre 15 y 480. |
| POST `/instructors` | Owner/admin: `email`, `zoom_user_id`, `revoke`. |
| GET `/{sessionId}` | Estado, últimos 100 mensajes, hasta 100 actividades, última fecha de transcripción y últimas 30 interacciones privadas del solicitante. |
| PATCH `/{sessionId}` | Transición `status=live\|ended\|cancelled`. |
| POST `/{sessionId}/join` | Credenciales efímeras del SDK según rol. |
| POST `/{sessionId}/messages` | `content` hasta 2000 caracteres. `@Soflia` genera respuesta pública; fallo de IA no elimina el mensaje. |
| POST `/{sessionId}/soflia` | `content`, `private=true`; respuesta y persistencia privadas. |
| POST `/{sessionId}/activities` | `kind=reading\|quiz`, `title`, `content`, `options`, `correct_option` (índice desde 0). |
| POST `/{sessionId}/upload` | Multipart `file`. |
| POST `/{sessionId}/respond` | `activity_id`, `answer` (índice desde 0 para quiz). |
| POST `/{sessionId}/download` | `activity_id`; URL firmada después de verificar alcance. |
| POST `/{sessionId}/transcript` | Solo anfitrión: `source_id`, `speaker`, `content`, `spoken_at`. Deduplicación por sesión e ID. |
| POST `/{sessionId}/attendance` | Presencia en el aula; conserva primera entrada y actualiza última señal. |

Errores: 400 entrada inválida; 401 sesión/firma inválida; 403 sin alcance; 404 recurso ausente; 409 estado incompatible; 429 límite; 502 Zoom rechazó; 503 dependencia/configuración no disponible.

## Validación y límites conocidos

Pruebas en `features/live/__tests__`: migración ejecutable, RLS entre organizaciones, curso compartido, revocación, separación de secretos, publicación atómica, idempotencia de finalización, cierre de sesión, contratos, firmas de webhook y rechazo de elevación de privilegios. Las pruebas de CSP verifican que los recursos de Zoom solo se permiten en salas In Live.

```sh
npm test --workspace=apps/web -- src/features/live/__tests__ src/lib/security/__tests__/content-security-policy.test.ts
npm run type-check:app --workspace=apps/web
npm run type-check:features --workspace=apps/web
```

La verificación global de tipos presenta errores preexistentes fuera de In Live. El lint normal está bloqueado por la configuración raíz que extiende `@typescript-eslint/recommended` sin el prefijo de plugin; se ejecutan comprobaciones focalizadas sin cambiar esa configuración ajena. No se afirma compilación global ni validación end-to-end de Zoom.

Verificación manual obligatoria en staging: programación y reintento, micrófono/cámara/pantalla, reunión finalizada desde Zoom, subtítulos, Soflia pública/privada, dos organizaciones, desconexión y reconexión, subida/descarga, quiz y lectura, rol retirado y navegación responsive. La vista Component de Zoom soporta escritorio; móvil/tablet muestra una indicación de usar escritorio, no una integración móvil equivalente.

Soflia utiliza una ventana reciente de 60 mensajes, 100 segmentos de transcripción y 8 turnos privados. Muestra ausencia/antigüedad del contexto; no dispone de todo el audio ni de memoria ilimitada de la clase. La captura se interrumpe al cerrar el navegador del anfitrión. La asistencia mide presencia declarada desde el aula, no minutos certificados de participación en Zoom.

El historial visible de chat/materiales es acotado; el almacenamiento conserva los registros, pero no hay aún navegación de mensajes antiguos más allá de la ventana de la sala. No se implementan grabaciones, RTMS, reprogramación de una reunión existente ni OAuth multicuenta.

## Operación y crecimiento

Los mensajes Realtime se incorporan al estado local sin releer la sala por mensaje. Hay resincronización periódica y al reconectar. Postgres Changes con RLS implica coste por suscriptor; **no está validado para 100000 usuarios simultáneos**. Antes de esa escala: carga por sala, colas para respuestas públicas de IA, Broadcast privado con autorización, agregados de estadísticas y RTMS/ingesta independiente. Dimensionar también licencias y concurrencia Zoom.

Definir con el propietario de datos la retención de chat/transcripción antes de producción. Propuesta de partida: 90 días para voz y chat, conservación de actividad/asistencia conforme al contrato educativo; no hay borrado automático en esta entrega. No registrar contenido, contraseñas, ZAK ni firmas en logs. Revisar solicitudes de programación `uncertain` y fallos del circuit breaker. Las modificaciones preservan los cambios de autenticación y otros trabajos que ya estaban presentes en el checkout.

Referencias: [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), [Zoom Meeting SDK](https://developers.zoom.us/docs/meeting-sdk/web/component-view/meetings-webinars/), [eventos de subtítulos](https://marketplacefront.zoom.us/sdk/meeting/web/components/functions/event_caption_message.html), [webhooks de Zoom](https://developers.zoom.us/docs/api/webhooks/), [compatibilidad de navegador](https://developers.zoom.us/docs/meeting-sdk/web/browser-support/).
