# LMS – Daily Pulse | 14 Marzo 2026

**Estado:** 🟢 Operativo (Consolidación de APIs de Jerarquía y refinamiento visual de Dashboard)

---

## ✅ Done hoy (P0 & P1)

- **P0 — Aplicación de Cache-Control en APIs**: Implementado `headers: { 'Cache-Control': 'no-store' }` en endpoints de Dashboard y Jerarquía para evitar visualización de datos obsoletos.
- **P0 — Corrección de visibilidad en Light Mode**: Los `StatCard` y el `BusinessPanelDashboard` ahora tienen contraste adecuado y bordes definidos cuando el tema es claro.
- **P1 — Endpoint de Asignación de Usuarios**: Finalizado `/api/[orgSlug]/business/hierarchy/users/assign` para mover usuarios entre equipos, zonas y regiones automáticamente.
- **P1 — Refactor de SuperAdmin Sidebar**: Se mejoró el comportamiento del sidebar colapsado; los iconos ahora permanecen visibles y la interacción es exclusiva del botón toggle.

## 🧪 Ready for QA

- **Asignación de usuario a equipo**: Verificar que al asignar un usuario a un equipo, su `zone_id` y `region_id` se actualicen correctamente por efecto cascada.
- **Modo Claro vs Oscuro**: Validar que los textos en las tarjetas de estadísticas sean legibles en ambos modos.
- **Navegación SuperAdmin**: Probar el colapsado del sidebar y confirmar que no hay saltos visuales en los iconos.

## 🚨 P0 Abiertos

- **Ninguno** — Los bloqueos de caché identificados por la mañana fueron mitigados.

## 🔧 Foco Siguiente

- Implementar la lógica de persistencia para `BusinessThemeCustomizer` (colores primarios y secundarios por organización).
- Finalizar el endpoint de `/seed` para generar estructuras jerárquicas predefinidas para nuevas empresas.

## ⚠️ Bloqueo / Riesgo

- **Migración de Datos**: Es necesario asegurar que los usuarios existentes tengan un `hierarchy_scope` definido para que las nuevas APIs no fallen por campos nulos.

## 🧭 Acción Requerida

- **Definición de Colores Default**: Decidir si las organizaciones nuevas deben heredar el tema de SofLIA por defecto o empezar con un esquema neutral.

## 🔗 Tablero + Evidencia

- Conversaciones: `47a46a3e-c01c-42f0-92ef-4a28039778ae`, `dac87d5a-9f5c-4d2c-91af-a3fabceb5602`
- Archivos clave:
  - [`users/assign/route.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/app/api/%5BorgSlug%5D/business/hierarchy/users/assign/route.ts)
  - [`BusinessPanelDashboard.tsx`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/business-panel/components/BusinessPanelDashboard.tsx)
  - [`Sidebar.tsx` (SuperAdmin)](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/components/ui/Sidebar.tsx)

---

## 📋 Reporte Extendido

### Contexto y Problema Principal

El día de hoy se centró en dos frentes: la **estabilidad de los datos en el frontend** (problemas de caché) y la **escalabilidad de la organización** mediante un sistema de jerarquías dinámicas. Se detectó que los navegadores estaban cacheando respuestas de la API que cambiaban frecuentemente (como el conteo de usuarios), lo que causaba confusión en la UI. Además, se inició el refinamiento estético para asegurar que el producto se sienta "premium" tanto en modo claro como oscuro.

---

### Cambios Implementados

#### 1. Gestión de Caché y Estabilidad de APIs

**Problema:** Al asignar un usuario a un equipo o cambiar un nodo jerárquico, el Dashboard no reflejaba el cambio inmediatamente debido al caché agresivo de Next.js/Browser.

**Solución:**
- Se forzó el comportamiento dinámico en los endpoints críticos añadiendo `headers: { 'Cache-Control': 'no-store' }` en las respuestas de `NextResponse`.
- Esto garantiza que cada vez que el usuario navegue al Dashboard de Negocio, los datos de `StatCard` (Total usuarios, Equipos activos) sean frescos.

#### 2. Sistema de Jerarquía de Negocio — [`users/assign/route.ts`](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA-Learning/apps/web/src/app/api/[orgSlug]/business/hierarchy/users/assign/route.ts)

**Problema:** Mover a un colaborador de un equipo a otro requería actualizar múltiples campos manualmente (`team_id`, `zone_id`, `region_id`).

**Solución:**
- **Asignación Inteligente**: El nuevo endpoint de asignación ahora solo requiere el `user_id` y el `team_id`.
- El sistema busca automáticamente a qué Zona y Región pertenece ese equipo y actualiza el perfil del usuario en una sola transacción.
- Se implementaron validaciones de `max_members` para prevenir que los equipos excedan su capacidad permitida.

#### 3. UX: Sidebar SuperAdmin y Temas Visuales

**Problema:** El sidebar de SuperAdmin tenía problemas de legibilidad al colapsar, y algunos componentes del Dashboard desaparecían visualmente en Modo Claro.

**Solución:**
- **Refactor de Sidebar**: Se eliminó la lógica de "pin" y "hover" automática para evitar movimientos inesperados. Ahora el estado colapsado es determinista y controlado por el usuario.
- **Ajustes de Contraste**: Se actualizaron las clases de CSS para usar variables de color que se adaptan mejor al tema claro, específicamente en `StatCard` donde los bordes sutiles ahora son visibles contra fondos blancos.

---

### Detalles Técnicos Relevantes

- **Estructura de Nodos**: Los nodos jerárquicos ahora utilizan un sistema de `path` basado en strings (ej: `root.norte.equipo_a`) para permitir consultas rápidas por sub-árboles sin necesidad de recursión profunda en base de datos.
- **Auth**: Se refinó `requireBusiness` para asegurar que el `orgSlug` en la URL coincida con la organización del usuario autenticado, previniendo accesos cruzados entre empresas.

---

### 🧪 Sección de QA — Israel

> Pruebas específicas para validar el despliegue de hoy.

#### Prueba 1: Flujo de Movilidad Interna (Jerarquía)

**Pasos:**
1. Crear un equipo en la "Zona Norte" y otro en la "Zona Sur".
2. Asignar un usuario al equipo de "Zona Norte".
3. Usar el endpoint (o UI si ya está disponible) para moverlo al equipo de "Zona Sur".

**Resultado Esperado:**
- [ ] El campo `team_id` cambia al ID del equipo Sur.
- [ ] El campo `zone_id` **cambia automáticamente** al ID de la Zona Sur.
- [ ] El campo `hierarchy_scope` se mantiene en `team`.

#### Prueba 2: Validación de Caché

**Pasos:**
1. Abrir el Dashboard de Negocio y observar el contador de usuarios.
2. En otra pestaña, crear o eliminar un usuario.
3. Volver a la pestaña del Dashboard y refrescar la página.

**Resultado Esperado:**
- [ ] El contador se actualiza inmediatamente sin necesidad de "Hard Refresh" (Ctrl+F5).

#### Prueba 3: Estética Modo Claro

**Pasos:**
1. Cambiar la aplicación a Modo Claro (Light Mode).
2. Navegar por el Dashboard y la lista de Usuarios.

**Resultado Esperado:**
- [ ] Las tarjetas de estadísticas tienen un borde visible o sombra suave que las separa del fondo.
- [ ] No hay textos blancos sobre fondos claros.

---

*Reporte generado el 14 de Marzo de 2026 — SofLIA Dev Team*
