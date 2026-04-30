# Admin and Business Panel Visual Alignment

## Goal

Keep the admin panel visually aligned with the business panel. The business panel is the canonical UX/UI reference for dashboard shells, hero sections, KPI cards, quick actions and compact activity surfaces.

## Shared Primitives

Use these cross-panel primitives before creating local variants:

- `apps/web/src/core/components/panel/PanelVisualPrimitives.tsx` via `apps/web/src/core/components/panel`
- `PanelDashboardHero`
- `PanelStatCard`
- `PanelQuickAction`
- `PanelSectionTitle`

The primitives live in `core` and receive a `PanelVisualTheme` object from each panel. This keeps the visual system reusable without making `core` depend on `business-panel` or `admin`.

## Canonical Pattern

- Shell: fixed full-height layout, sticky header, sidebar inside the main flex row, scroll only in the content area.
- Content width: inner wrapper `max-w-[1920px]`.
- Hero: image `/images/dashboard-header.png`, primary-color overlay, white foreground text, compact responsive padding.
- KPI cards: horizontal glass card, `16px` radius, icon capsule, uppercase label, compact heavy value, subtle radial glow.
- Quick actions: same glass surface and icon capsule as KPI cards, with a hover arrow.
- Activity: `rounded-2xl` bordered surface with compact rows and semantic status dots.

## Admin Adoption

The admin dashboard now uses the business panel pattern for:

- `AdminLayout`
- `AdminHeader`
- `AdminSidebar`
- `AdminDashboardHero`
- `AdminDashboardStatsSection`
- `AdminDashboardSidebar`
- `AdminDashboardActivitySection`

New admin views should reuse `PanelSectionTitle`, `PanelStatCard` and `PanelQuickAction`. If a view needs a new visual variant, extend the shared primitive with props instead of copying local JSX.
