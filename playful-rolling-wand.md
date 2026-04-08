# Plan: Eliminate All Hardcoded Hex Colors from Frontend

## Context
Following the `useBusinessPanelTheme` migration for the `/users/` page components, a full scan of the frontend revealed **~1000+ hardcoded hex color instances** across two problem categories:
1. **Business-panel components** that should consume `useBusinessPanelTheme()` but instead reimplement color logic locally
2. **Other feature components** (admin, auth, courses, shared) that use `useThemeStore` but still have `isDark ? '#hex' : '#hex'` ternaries

The goal: zero `#XXXXXX` values used directly in JSX `style={{}}` or `className` for theme-sensitive colors. Chart/data-viz palette constants and `preset-themes.ts` definitions are exempt.

---

## Phase 1: Extend `useBusinessPanelTheme` with Missing Tokens

**File:** `apps/web/src/features/business-panel/hooks/useBusinessPanelTheme.ts`

Add to `BusinessPanelThemeTokens` interface and hook return:
- `onPrimaryColor: string` — foreground text on primary button (`isDark ? '#000000' : '#FFFFFF'`)
- `chartColors: string[]` — ordered palette for Nivo/Recharts: `['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4']`
- `difficultyColors: { beginner: string; intermediate: string; advanced: string; default: string }` — `#22C55E / #EAB308 / #EF4444 / #3B82F6`

These tokens let downstream components resolve all remaining hex values through the hook.

---

## Phase 2: Business-Panel App Pages (Critical — cascading fixes)

### 2a. `useCoursesPageLogic.ts` (CRITICAL)
**File:** `apps/web/src/app/[orgSlug]/business-panel/courses/useCoursesPageLogic.ts`

Currently reimplements the entire theme system (lines 31–36). Replace with:
```ts
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
// ...
const theme = useBusinessPanelTheme()
const { primaryColor, accentColor, secondaryColor, textColor, cardBg, borderColor } = theme
```
Remove all local `isDark ? '#...' : '#...'` color computation. Fixing this alone cascades to `CoursesPageContent.tsx` (which prop-drills from this hook).

### 2b. `CourseStatCard.tsx`
**File:** `apps/web/src/app/[orgSlug]/business-panel/courses/CourseStatCard.tsx`

Remove props: `isDark`, `color`. Call `useBusinessPanelTheme()` internally. Replace lines 16–30 isDark ternaries with `theme.textColor`, `theme.cardBg`, `theme.borderColor`. Keep per-card `iconColor` as a semantic prop (passed by parent as a fixed constant).

### 2c. `CourseCard.tsx`
**File:** `apps/web/src/app/[orgSlug]/business-panel/courses/CourseCard.tsx`

Call `useBusinessPanelTheme()` internally. Replace `isDark` ternaries with `theme.textColor`, `theme.cardBg`, `theme.borderColor`, `theme.mutedTextColor`. Replace difficulty hex values with `theme.difficultyColors.beginner` etc. Remove `primaryColor`, `textColor`, `cardBg`, `isDark` from props interface.

### 2d. `analytics/page.tsx` and `reports/page.tsx`
**Files:**
- `apps/web/src/app/[orgSlug]/business-panel/analytics/page.tsx`
- `apps/web/src/app/[orgSlug]/business-panel/reports/page.tsx`

Both directly call `useOrganizationStylesContext()` and compute `textColor` locally. Replace with:
```ts
const { textColor } = useBusinessPanelTheme()
```
Remove `useOrganizationStylesContext` import and local fallback hex.

### 2e. `courses/[id]/page.tsx`
**File:** `apps/web/src/app/[orgSlug]/business-panel/courses/[id]/page.tsx`

Remove hardcoded `bg-[#0A0D12]` class and `style={{ color: '#FFFFFF' }}`. Use `theme.panelBg` and `theme.textColor` from `useBusinessPanelTheme()`. Pass theme down to `useBusinessCourseDetailPageLogic()` or call hook directly on page.

---

## Phase 3: Business-Panel Feature Components (Modals & UI)

### 3a. Business Edit User Modal
**Files:**
- `apps/web/src/features/business-panel/components/business-edit-user-modal/BusinessEditUserModal.tsx` — Replace isDark ternaries on lines 51–57 with `useBusinessPanelTheme()` tokens (`primaryColor`, `accentColor`, `textColor`, `inputBg`)
- `apps/web/src/features/business-panel/components/business-edit-user-modal/UserFormFields.tsx` — Replace local status color object with `theme.statusColors`

### 3b. Business Invite Modal
**Files:**
- `apps/web/src/features/business-panel/components/business-invite-modal/BusinessInviteManageTab.tsx` — Replace `isDark ? '#252b3b' : '#FFFFFF'` with `theme.cardBg`
- `apps/web/src/features/business-panel/components/business-invite-modal/BusinessInviteModalHeader.tsx` — Replace isDark ternaries with theme tokens

### 3c. Course Detail Components
**Files (all in `features/business-panel/components/business-course-detail/`):**
- `BusinessCourseDetailSidebar.tsx` — `isDark ? 'rgba(30, 35, 41, 0.8)' : '#FFFFFF'` → `theme.cardBg`
- `BusinessCourseContentTab.tsx` — Replace inline isDark ternary on line 70 with `theme.textColor`/`theme.primaryColor`
- `BusinessCourseDetailHero.tsx`, `BusinessCourseInstructorTab.tsx`, `BusinessCourseReviewsTab.tsx` — Replace `color: '#FFFFFF'` with `theme.onPrimaryColor` where on primary bg; use `theme.successColor` for success badges

### 3d. Hierarchy NodeItem
**File:** `apps/web/src/features/business-panel/components/hierarchy/NodeItem.tsx`

Replace Tailwind arbitrary color classes (`text-[#10B981]`, `border-[#10B981]/20`) with `style={{ color: theme.successColor }}` from `useBusinessPanelTheme()`.

### 3e. Business Panel Sidebar & Header
**Files:**
- `apps/web/src/features/business-panel/components/BusinessPanelSidebar.tsx`
- `apps/web/src/features/business-panel/components/BusinessPanelHeader.tsx`

Replace all `isDark ? '#hex' : '#hex'` patterns with `useBusinessPanelTheme()` tokens. These are likely already receiving org styles — migrate to hook consumption.

### 3f. User Stats Modal Tabs
**Files:**
- `apps/web/src/features/business-panel/components/business-user-stats-modal/BusinessUserStatsActivityTab.tsx` — Replace chart hex values (`#10B981`, `#3B82F6`, `#F59E0B`) with `theme.chartColors`
- `apps/web/src/features/business-panel/components/business-user-stats-modal/BusinessUserStatsProgressTab.tsx` — Same: isDark ternaries → theme tokens, chart colors → `theme.chartColors`

### 3g. Business Subscription Plans
**File:** `apps/web/src/features/business-panel/components/business-subscription-plans/BusinessSubscriptionPlans.tsx`

50+ hex values. Replace with `useBusinessPanelTheme()` tokens: `primaryColor`, `accentColor`, `textColor`, `cardBg`, `successColor`. Hardcoded design-system grays (structural layout) may stay as Tailwind classes (`bg-gray-100`, `text-gray-500`).

---

## Phase 4: Other Features (Own Theme System — use `useThemeStore` + Tailwind)

These features are outside business-panel. They already use `useThemeStore()` (`resolvedTheme === 'dark'`). Fix: replace `isDark ? '#hex' : '#hex'` with Tailwind `dark:` variants or CSS variables from `globals.css`.

### 4a. `AdminUsersPage.tsx`
**File:** `apps/web/src/features/admin/components/AdminUsersPage.tsx`

Replace `isDark ? '#00D4B3' : '#0A2540'` badge patterns with Tailwind:
- `text-[#00D4B3] dark:text-[#00D4B3]` → `text-[var(--color-primary)] dark:text-[var(--color-accent)]`
- Or introduce a local `adminRoleColors` constant using CSS vars

### 4b. `CourseLia.tsx`
**File:** `apps/web/src/features/courses/components/CourseLia.tsx`

Replace `linkColor = isDarkMode ? '#00D4B3' : '#0A2540'` and surrounding style objects with CSS variables: `color: 'var(--color-accent)'` (aqua works in both modes as a link color).

### 4c. `ChatHeader.tsx`
**File:** `apps/web/src/core/components/AIChatAgent/ChatHeader.tsx`

Replace `isDark ? '#1E2329' : '#FFFFFF'` with Tailwind `dark:bg-gray-800 bg-white` classes. Remove inline style overrides where Tailwind suffices.

### 4d. Unified Invite Modal Components
**Files (all in `apps/web/src/shared/components/unified-invite-modal/`):**
- `UnifiedInviteModal.tsx`, `UnifiedInviteFormsView.tsx`, `UnifiedInviteManageLinksView.tsx`, `UnifiedInviteSuccessView.tsx`

These already use a `theme` object passed from context. Replace remaining `theme.isDark ? '#000000' : '#FFFFFF'` patterns by adding `onPrimary` to the theme object they receive, or use `isDark ? '#000000' : '#FFFFFF'` as a named constant `TEXT_ON_PRIMARY`.

### 4e. `OrganizationAuthLayout.tsx`
**File:** `apps/web/src/features/auth/components/OrganizationAuth/OrganizationAuthLayout.tsx`

Replace `isDark ? '#1a1a2e' : 'rgba(255, 255, 255, 0.9)'` with `isDark ? panelStyles?.card_background || 'var(--color-bg-dark)' : '#FFFFFF'`.

### 4f. `markdown.tsx`
**File:** `apps/web/src/shared/utils/markdown.tsx`

Replace `isDarkMode ? '#00D4B3' : '#0A2540'` with `'var(--color-accent)'` — aqua works as link color in both modes.

---

## Files NOT to Change

- `apps/web/src/features/business-panel/config/preset-themes.ts` — defines theme presets, hex values are intentional
- `apps/web/src/features/business-panel/utils/colorDetection.ts` — color utility, hex values are intentional
- Chart data arrays in `ChartSection.tsx`, `ChoroplethChart.tsx` — Nivo requires static color arrays, acceptable
- `BrandingColorPicker.tsx` placeholder — UI color picker, hex is the input format

---

## Critical Files (reading required before execution)

| File | Why |
|------|-----|
| `features/business-panel/hooks/useBusinessPanelTheme.ts` | Extend before touching any component |
| `app/[orgSlug]/business-panel/courses/useCoursesPageLogic.ts` | Most impactful single fix |
| `features/business-panel/components/BusinessPanelSidebar.tsx` | Large file, verify structure before edit |
| `features/business-panel/components/business-subscription-plans/BusinessSubscriptionPlans.tsx` | 50+ hex values, highest file complexity |

---

## Execution Order

1. Extend `useBusinessPanelTheme` (Phase 1) — prerequisite for all business-panel work
2. `useCoursesPageLogic.ts` (Phase 2a) — cascades to `CoursesPageContent.tsx`
3. `analytics/page.tsx`, `reports/page.tsx` (Phase 2d) — trivial, 2 lines each
4. `CourseStatCard.tsx`, `CourseCard.tsx` (Phase 2b, 2c) — independent
5. Modal components (Phase 3a, 3b) — independent
6. Course detail components (Phase 3c) — independent
7. Remaining business-panel components (Phase 3d–3g) — independent
8. Other features (Phase 4a–4f) — last, different theme system

---

## Verification

After each phase:
- Run `npm run type-check --workspace=apps/web` — confirm no TypeScript errors
- Visually verify in browser: toggle dark/light mode, check all changed pages render correctly
- Pages to check: `/[orgSlug]/business-panel/users`, `/courses`, `/analytics`, `/reports`, `/courses/[id]`
- Verify org branding still applies (navigate as a business org with custom colors)
