# Agenda de sesiones en Hub

Estado: implementación local. Actualizado: 2026-10-11.

`POST /api/auth/live/catalog` recibe `{ organization_slug, page, view }`, con página entre 0 y 100000 y vista `student` o `instructor`. Usa verificación bearer, límites de cuerpo del aula y rate limit de lectura. Revalida organización activa, membresía y permisos mediante `hubActorContext`; `listLiveCatalog` aplica la autorización académica y paginación de 20 sesiones con periodo `upcoming`.

La salida versión 1 contiene actor verificado, permiso para enseñar, total y metadatos públicos de las sesiones. Nunca incluye URLs Zoom, IDs de reunión, tokens ni rol de anfitrión. Los títulos de cursos e instructores usan el catálogo acotado existente y etiquetas de respaldo cuando no están en esa página de metadatos. La apertura de medios conserva `/api/auth/live/access` y su autorización independiente.

No requiere migración. Publicar esta ruta junto con el cliente Hub es necesario para consultar sesiones reales; sin esa publicación el cliente muestra un error recuperable. La implementación vive en `apps/web/src/app/api/auth/live/catalog/route.ts` y las pruebas en su subdirectorio `__tests__`.

La publicación incluye `apps/web/src/proxy/api-route-auth.ts`: la ruta exacta del catálogo debe delegar autenticación al handler, como `access` y `workspace`, para aceptar bearer desde main sin cookies web. También incluye `apps/web/src/proxy/rate-limits.ts`: POST del catálogo usa `live-access`, sin consumir los cinco intentos de login. Rutas hijas no enumeradas conservan el filtro y presupuesto de autenticación. La delegación no elimina la verificación `getUser`, la membresía activa ni el aislamiento académico del handler.

Diagnóstico confirmado el 2026-10-11: la consulta desde Hub hacia `https://soflia.ai` devolvía 401 con `UNAUTHENTICATED` del filtro web; Hub lo presentaba incorrectamente como falta de acceso a la organización. Los ajustes son locales y necesitan publicarse junto con el endpoint. La consulta sin bearer no acredita que la ruta esté desplegada, porque el filtro rechaza también rutas inexistentes antes de resolverlas.
