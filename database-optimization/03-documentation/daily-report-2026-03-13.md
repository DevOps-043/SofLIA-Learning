# LMS – Daily Pulse | 13 Marzo 2026

**Estado:** 🟢 Estable (Branding B2B y detección de organización corregidos; sistema de invitaciones funcional)

---

## ✅ Done hoy (P0 & P1)

- **P0 — Branding de invitaciones B2B corregido**: El correo ahora muestra "SofLIA" como remitente, el logo de la empresa invitante como imagen principal, y el logo de SofLIA en el footer.
- **P0 — Detección de organización en modal de invitación**: La API de usuarios ahora devuelve `orgData` garantizado; eliminados errores "No se encontró la organización" al intentar invitar desde empresas sin usuarios activos.
- **P1 — Imágenes rotas en correos resueltas**: Se añadió lógica `ensureAbsoluteUrl()` para que cualquier ruta relativa o de `localhost` no rompa las imágenes en clientes reales de correo (Gmail, Outlook).
- **P1 — Acceso B2C desactivado**: La ruta `check-purchase` solo valida asignaciones B2B; la verificación de compras individuales fue comentada para enforcement B2B-only.

## 🧪 Ready for QA

- **Invitación individual desde "Board ready"**: Enviar a correo externo → verificar remitente es SofLIA, primera imagen es logo de Board ready, segunda imagen SofLIA en footer.
- **Reenvío de invitación**: Usar opción "Reenviar" → debe mantener el logo correcto de la empresa.
- **Acceso multi-tenant**: Revisar que usuario asignado en Org A no pueda acceder si contexto activo es Org B.

## 🚨 P0 Abiertos

- **Ninguno en este sprint** — Los errores principales de branding e invitaciones fueron resueltos.

## 🔧 Foco Siguiente

- Actualizar `NEXT_PUBLIC_APP_URL` a dominio de producción para que las imágenes de SofLIA carguen correctamente en correos reales (actualmente configurado a `localhost:3000`).
- Revisar el flujo B2C completo para remoción definitiva a futuro.

## ⚠️ Bloqueo / Riesgo

- **Logo de SofLIA en correos locales**: En el entorno de desarrollo, la imagen de SofLIA no cargará en clientes de correo ya que apunta a `localhost`. Esto es esperable; funcionará correctamente en producción con el URL real configurado en `NEXT_PUBLIC_APP_URL`.

## 🧭 Acción Requerida

- **Configurar `NEXT_PUBLIC_APP_URL` en producción** a la URL pública real (ej. `https://soflia.ai`) para que el logo de SofLIA en los correos sea visible para los destinatarios.

## 🔗 Tablero + Evidencia

- Conversación de implementación: `d0cd0c4d-c506-48ca-9009-304abdc0c7dc`
- Archivos modificados:
  - [`email.service.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/auth/services/email.service.ts)
  - [`invitation.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/auth/actions/invitation.ts)
  - [`useBusinessUsers.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/business-panel/hooks/useBusinessUsers.ts)
  - [`/api/[orgSlug]/business/users/route.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/app/api/%5BorgSlug%5D/business/users/route.ts)
  - [`/api/courses/[slug]/check-purchase/route.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/app/api/courses/%5Bslug%5D/check-purchase/route.ts)

---

## 📋 Reporte Extendido

### Contexto y Problema Principal

El usuario reportó que las invitaciones enviadas desde la empresa **"Board ready"** no mostraban el branding correcto: el remitente aparecía con el nombre de la organización del administrador (en lugar de "SofLIA") y las imágenes del correo aparecían rotas. Adicionalmente, se identificó un bug crítico que impedía que el sistema detectara la organización al abrir el modal de invitación.

---

### Cambios Implementados

#### 1. Servicio de Correo — [`email.service.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/auth/services/email.service.ts)

**Problema:** El campo `from` del correo usaba `"${organizationName}" <noreply@soflia.ai>`, lo que hacía que el nombre del remitente fuera el de la empresa en lugar de la plataforma.

**Solución:**
- Cambio de `from` a `"SofLIA" <noreply@soflia.ai>` para identidad uniforme.
- Rediseño del template HTML de invitación:
  - El **logo de la organización invitante** aparece de forma prominente en el **header superior** (con fallback al nombre como texto si no hay logo).
  - El **logo de SofLIA** se movió al **footer** como firma institucional de la plataforma.
- Agregado helper `ensureAbsoluteUrl()`: convierte rutas relativas o paths de Storage en URLs absolutas antes de insertarlas en el HTML.
- Manejo de `localhost`: si la `NEXT_PUBLIC_APP_URL` apunta a localhost, se usa un placeholder público para que el logo no aparezca roto en pruebas desde clientes de correo reales.

#### 2. Acción de Invitación — [`invitation.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/auth/actions/invitation.ts)

**Problema:** La acción `resendInvitationAction` no incluía `logo_url` en la consulta a la tabla `organizations`, por lo que el logo quedaba `undefined` al reenviar.

**Solución:**
- Añadido `logo_url` al `select` de la consulta en `resendInvitationAction`.
- El `inviteUserAction` ya incluía `logo_url`; se confirmó que el campo se pasa correctamente.

#### 3. Hook de Usuarios de Negocio — [`useBusinessUsers.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/business-panel/hooks/useBusinessUsers.ts)

**Problema:** La lista de usuarios se cargaba a través de dos llamadas separadas (`BusinessUsersService.getOrganizationUsers` y `getOrganizationStats`). Los datos de la organización se obtenían del store solo si había usuarios; si la empresa estaba vacía o el store no estaba sincronizado, `orgData` era `null` y el modal de invitación fallaba.

**Solución:**
- Refactorización de `fetchUsers` para usar una sola llamada `fetch` al endpoint `GET /api/[orgSlug]/business/users`.
- El `orgData` ahora se sincroniza **directamente desde la respuesta de la API**, con fallback al store local.
- Eliminada la dependencia en la lista de usuarios para obtener el ID de la organización.

#### 4. API de Usuarios — [`/api/[orgSlug]/business/users/route.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/app/api/%5BorgSlug%5D/business/users/route.ts)

**Problema:** El endpoint solo devolvía `users` y `stats`; el frontend no tenía acceso garantizado al ID o branding de la organización.

**Solución:**
- Se agregó una tercera consulta en paralelo para obtener `name`, `logo_url` y `brand_logo_url` de la organización.
- La respuesta ahora incluye un objeto `organization: { id, name, logo_url }` adicional.
- Se priorizó `brand_logo_url` sobre `logo_url` para usar siempre el logo de marca corporativa si existe.

#### 5. Restricción de Acceso B2B — [`check-purchase/route.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/app/api/courses/%5Bslug%5D/check-purchase/route.ts)

- La lógica de verificación de compras individuales (B2C) fue comentada para forzar el modelo B2B.
- La API ahora solo valida asignaciones en la tabla `organization_course_assignments`, filtradas por `orgId` de query param.

---

### Causa Raíz de las Imágenes Rotas

Las imágenes en los correos se alojan en Supabase Storage y tienen URLs absolutas públicas (ej. `https://mrqnm...supabase.co/storage/v1/object/...`). Estas **deberían funcionar correctamente** en los correos.

El problema con el logo de SofLIA era diferente: la ruta `${NEXT_PUBLIC_APP_URL}/Logo.png` apuntaba a `http://localhost:3000/Logo.png` durante el desarrollo. Los clientes de correo bloquean URLs que apuntan a `localhost` ya que no son accesibles públicamente. En producción, con `NEXT_PUBLIC_APP_URL` configurado al dominio real, esto funcionará sin problema.

---

## 🧪 Sección de QA — Israel

> Esta sección está destinada a las pruebas funcionales que debe realizar **Israel** para validar los cambios del día.

### Prueba 1: Envío de Invitación desde "Board Ready"

**Objetivo:** Verificar que el correo de invitación llega con el branding correcto.

**Pasos:**
1. Iniciar sesión como administrador de la empresa **Board ready**.
2. Navegar a `Panel de Negocio → Usuarios`.
3. Hacer clic en **Invitar usuario** e ingresar un correo de prueba (puede ser un correo personal de Israel).
4. Confirmar el envío.

**Resultados Esperados:**
- [ ] El remitente del correo aparece como **SofLIA** (no como "Board ready").
- [ ] La primera imagen del correo es el **logo de Board ready**.
- [ ] El logo de **SofLIA** aparece en la parte inferior como firma de plataforma.
- [ ] El botón "Configurar mi cuenta" funciona y dirige a la URL de registro correcta.

---

### Prueba 2: Reenvío de Invitación

**Objetivo:** Confirmar que el reenvío también mantiene el branding correcto.

**Pasos:**
1. Desde `Panel de Negocio → Usuarios`, localizar un usuario con estado `invited`.
2. Usar la opción de **Reenviar invitación** en el menú de acciones.

**Resultados Esperados:**
- [ ] El correo reenviado llega con el mismo branding que en la Prueba 1.
- [ ] El enlace del correo reenviado es válido (nuevo token, 7 días de vigencia).

---

### Prueba 3: Detección de Organización en el Modal

**Objetivo:** Verificar que el modal de invitación funciona incluso si la empresa tiene pocos o ningún usuario.

**Pasos:**
1. Si existe una empresa de prueba con 0 o 1 usuarios, navegar a su panel de negocios.
2. Abrir el modal de invitación.

**Resultados Esperados:**
- [ ] El modal se abre **sin errores** en consola ni mensajes de "No se encontró la organización".
- [ ] La invitación se envía correctamente y aparece el usuario en estado `invited`.

---

### Prueba 4: Acceso a Cursos por Organización (Multi-Tenant)

**Objetivo:** Verificar que el acceso a cursos está restringido al contexto de la organización activa.

**Pasos:**
1. Usar un usuario miembro de dos organizaciones (ej. "Board ready" y otra empresa).
2. Con el contexto activo en **Org A**, intentar acceder a un curso asignado solo en **Org B**.

**Resultados Esperados:**
- [ ] El sistema **niega el acceso** al curso cuando el contexto activo es diferente a la organización que lo asignó.
- [ ] Al cambiar el contexto a **Org B**, el acceso al curso **se habilita correctamente**.

---

*Reporte generado el 13 de Marzo de 2026 — SofLIA Dev Team*
