# Migración Multi-Empresa — Archivos Pendientes

**Fecha:** 13/03/2026
**Objetivo:** Aislar correctamente los datos entre empresas en todas las rutas API y llamadas del frontend.

**El bug:** `requireBusiness()` sin argumentos toma la organización más reciente del usuario → datos mezclados.
**El fix:** `requireBusiness({ organizationSlug: orgSlug })` → usa la org activa en la URL.

---

## ✅ YA MIGRADO (referencia)

| Área | Rutas bajo `api/[orgSlug]/business/` |
|------|--------------------------------------|
| Courses (7) | `courses/`, `courses/[id]/`, `/assign`, `/assigned-users`, `/analytics`, `/purchase`, `/deadline-suggestions` |
| Dashboard (4) | `dashboard/stats`, `dashboard/activity`, `dashboard/progress`, `dashboard/layout` |
| Users (6) | `users/`, `users/stats`, `users/[userId]/`, `/suspend`, `/activate`, `/resend-invitation` |
| Analytics | `analytics/` |
| Reports | `reports/data/` |
| Settings | `settings/`, `branding/`, `styles/`, `subscription/change-plan/`, `teams/`, `check-slug/` |
| Invites & Requests | `invite-links/`, `invite-links/[id]/`, `join-requests/`, `join-requests/[id]/` |
| Notifications | `notifications/settings/` |
| Hierarchy (35) | `hierarchy/config`, `stats`, `nodes/`, `teams/`, `regions/`, `zones/`, `chats/`, `courses/assign`, `assignments/`, etc. |
| Users (Extra) | `users/stats`, `[userId]/stats`, `import/`, `template/`, `upload-picture/` |
| Analytics & Progress | `analytics/`, `analytics/skills/`, `progress/` |

---

## 🔴 BACKEND — Rutas que falta crear

Todas van en `apps/web/src/app/api/[orgSlug]/business/`

### Grupo 1: Analytics (COMPLETADO ✅)
Todas las rutas de analíticas han sido migradas.

---

---

### Grupo 2: Certificates (COMPLETADO ✅)
Todas las rutas de certificados han sido migradas.

---

---

### Grupo 3: Hierarchy (COMPLETADO ✅)
Las 35 rutas de jerarquía han sido migradass exitosamente al esquema `[orgSlug]`.

---


---

### Grupo 5: Notifications & Progress (COMPLETADO ✅)
Todas las rutas de progreso y notificaciones han sido migradas.

---

### Grupo 6: Settings (COMPLETADO ✅)
Todas las rutas de configuración han sido migradas.

---

### Grupo 7: Users — sub-rutas (COMPLETADO ✅)
Todas las sub-rutas de gestión de usuarios han sido migradas.

---

## 🟡 FRONTEND — Archivos que necesitan actualizar sus URLs

Todos los paths son relativos a `apps/web/src/`

---

### Settings / Estilos (3 archivos)

| Archivo | Líneas | URL actual → URL nueva |
|---------|--------|------------------------|
| `features/business-panel/contexts/OrganizationStylesContext.tsx` | **179, 269, 311** | `/api/business/settings/styles` → `/api/${orgSlug}/business/styles` |
| `features/business-panel/components/BusinessThemeCustomizer.tsx` | **91** | `/api/business/settings/branding` → `/api/${orgSlug}/business/branding` |
| `features/business-panel/components/BusinessSettings.tsx` | **1387** | `/api/business/settings/check-slug` → `/api/${orgSlug}/business/settings/check-slug` |

> 🚨 **`OrganizationStylesContext.tsx` es el más crítico** — se ejecuta en todos los layouts del business-panel.
> Si carga los estilos de la org equivocada, los colores/logo de toda la UI son incorrectos.

---


---

### Users — Sub-rutas (4 componentes + 1 page)

| Archivo | Líneas | URL actual |
|---------|--------|-----------|
| `features/business-panel/components/BusinessUserStatsModal.tsx` | **198** | `/api/business/users/${user.id}/stats` |
| `features/business-panel/components/BusinessImportUsersModal.tsx` | **54** | `/api/business/users/template` |
| `features/business-panel/components/BusinessImportUsersModal.tsx` | **96** | `/api/business/users/import` |
| `features/business-panel/components/BusinessAddUserModal.tsx` | **130** | `/api/business/users/upload-picture` |
| `app/[orgSlug]/business-panel/users/page.tsx` | **811** | `/api/business/users/template` |

---

### Hierarchy (3 componentes)

| Archivo | Líneas | URL actual |
|---------|--------|-----------|
| `features/business-panel/components/hierarchy/NodeForm.tsx` | **225, 264** | `/api/business/hierarchy/geocode` |
| `features/business-panel/components/hierarchy/HierarchyForms.tsx` | **18** | `/api/business/hierarchy/geocode` |
| `features/business-panel/components/hierarchy/TeamRequiredBanner.tsx` | **23** | `/api/business/hierarchy/check-team` |

---

### Services — Constantes `API_BASE` (6 servicios)

Cada constante afecta **todas** las llamadas del servicio completo:

| Archivo | Línea | Valor actual |
|---------|-------|-------------|
| `features/business-panel/services/dynamicHierarchy.service.ts` | **9** | `'/api/business/hierarchy'` |
| `features/business-panel/services/hierarchy.service.ts` | **33** | `'/api/business/hierarchy'` |
| `features/business-panel/services/hierarchy-assignments.service.ts` | **16** | `'/api/business/hierarchy/courses'` |
| `features/business-panel/services/hierarchyChats.service.ts` | **21** | `'/api/business/hierarchy/chats'` |
| `features/business-panel/services/userGroups.service.ts` | **50** | `'/api/business/user-groups'` |
| `features/business-panel/services/joinRequests.service.ts` | **20, 33** | fetch directo a `/api/${orgSlug}/business/join-requests` |

---

### LIA Context Metadata (1 archivo)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `lib/lia-context/config/page-metadata.ts` | **199, 208, 217** | Referencias a `/api/business/users` y `/api/business/users/[userId]/stats` usadas como contexto para el asistente SofLIA |

> ⚠️ Aunque son metadatos, si SofLIA usa estos endpoints para obtener contexto, también deben apuntar a la org correcta.

---

> Patrón a aplicar en los services: cambiar de constante estática a función dinámica:
> ```ts
> // ANTES
> const API_BASE = '/api/business/hierarchy'
>
> // DESPUÉS
> const apiBase = (orgSlug: string) => `/api/${orgSlug}/business/hierarchy`
> ```

---

## 📊 Resumen

| Área | Rutas backend | Archivos frontend |
|------|:-------------:|:-----------------:|
| Analytics/Skills | 1 | — |
| Certificates | 2 | — |
| Hierarchy | 35 | 3 componentes + 4 services |
| Invite Links | 2 | 4 componentes |
| Join Requests | 2 | 1 service |
| Notifications | 1 | — |
| Progress | 1 | — |
| Settings | 3 | 3 componentes |
| User Groups | 4 | 1 service |
| Users (sub) | 4 | 4 componentes + 1 page |
| LIA Context | — | 1 config |
| **TOTAL** | **55** | **~21 archivos** |

---

## 🎯 Orden de implementación sugerido

| Prioridad | Área | Motivo |
|-----------|------|--------|
| 1 | `OrganizationStylesContext.tsx` | Afecta visualmente toda la app |
| 2 | Settings (organization, check-slug, subscription) | Configuración de la empresa |
| 3 | Invite Links + Join Requests | Flujo de onboarding de usuarios |
| 4 | User Groups | Gestión de usuarios |
| 5 | Hierarchy — estructura (nodes, regions, zones) | Base de la jerarquía |
| 6 | Hierarchy — chats | Comunicación interna |
| 7 | Hierarchy — course assignments | Formación dentro de jerarquía |
| 8 | Users sub-rutas (import, template, upload, stats) | Operaciones de usuarios |
| 9 | Certificates, Notifications, Progress | Baja frecuencia de uso |
