# Sesiones síncronas en Soflia Hub

Learning conserva administración, catálogo y permisos académicos. Soflia Hub de escritorio recibe la sesión y ejecuta Zoom en su navegador integrado.

La arquitectura y el contrato vigente se documentan en [Sesiones de Learning en Hub](learning-hub-synchronous-plan.md). Ese documento reemplaza la propuesta anterior de un aula integrada en Learning.

La ruta /{orgSlug}/live/{sessionId} es ahora una ficha administrativa. Las tarjetas del dashboard y agenda ofrecen Abrir Soflia Hub. Los endpoints de interacción del aula anterior responden 410 para clientes antiguos autorizados.

Se conserva la migración histórica y sus datos. La migración 20261010173000_live_hub_desktop.sql añade webinars y retira la publicación de mensajes/actividades antiguas. No se hacen borrados remotos como parte de este refactor.
