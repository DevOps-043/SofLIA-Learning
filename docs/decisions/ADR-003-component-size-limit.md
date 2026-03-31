# ADR-003: Límite de 300 líneas por componente/archivo de lógica

**Estado:** Aceptado
**Fecha:** 2026-03-30

## Contexto

Durante el análisis de deuda técnica, se identificaron múltiples archivos de más de 1,000 líneas:
- `users/page.tsx` — 1,863 líneas
- `BusinessReports.tsx` — 1,108 líneas
- `LiaSidePanel.tsx` — 1,181 líneas
- `InstructorCourseManagementPage.tsx` — 1,291 líneas
- `useLearnPageLogic.ts` — 808 líneas

Estos archivos tienen múltiples responsabilidades mezcladas, son difíciles de mantener y su riesgo de regresión es alto.

## Decisión

**Regla:** ningún componente React ni hook de lógica debe superar las 300 líneas.

**Estrategia de extracción:**
1. **Sub-componentes UI**: mover a un subdirectorio `components/` o `reports/` dentro del feature
2. **Lógica de negocio**: extraer a un custom hook `use[Feature]Logic.ts`
3. **Utilidades puras**: mover a `utils/` con su propio archivo
4. **Tipos compartidos**: consolidar en `types.ts` local

## Razones

1. **Mantenibilidad**: encontrar y modificar una función específica es O(1) si está en su propio archivo.
2. **Testing**: los componentes pequeños y los hooks puros son más fáciles de testear de forma aislada.
3. **Riesgo de regresión**: un archivo de 300 líneas tiene superficie de efecto mucho menor que uno de 1,500.
4. **Colaboración**: múltiples desarrolladores pueden trabajar en sub-componentes sin conflictos de merge.

## Consecuencias

- Los archivos nuevos deben diseñarse desde el inicio con esta restricción.
- Los archivos existentes que superan el límite se refactorizan iterativamente (no se requiere todo en un sprint).
- La regla aplica a `.tsx` y `.ts` de lógica (hooks, services). No aplica a archivos de tipos, constantes o barrel exports.

## Excepciones conocidas

- `LiaSidePanelContent.tsx` — ~1,080 líneas. Contiene toda la UI del panel IA. Pendiente de refactorizar en un sprint futuro.
- `InstructorCourseManagementPage.tsx` — 1,291 líneas. En backlog de Sprint 1.5.
- Archivos generados automáticamente (`lib/supabase/types.ts`).
