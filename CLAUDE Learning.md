# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SofLIA Learning** (formerly Aprende y Aplica) is a B2B educational platform for enterprise AI training, built with a monorepo architecture using Next.js for the frontend and Express for the backend, with Supabase as the database.

**Tech Stack:**

- Frontend: Next.js 14.2.15, React 18.3.1, TypeScript 5.9.3, TailwindCSS 3.4.18
- Backend: Express 4.18.2, TypeScript 5.3.3, Node.js 22+
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth (+ SSO Google/Microsoft via OAuth)
- State Management: Zustand 5.0.2
- UI Components: Radix UI, Headless UI, custom components with Framer Motion 12.23.24
- Data Visualization: Nivo charts (v0.99.0), Recharts 3.x, Tremor
- AI Integration: OpenAI GPT-4o-mini (SofLIA assistant)
- Internationalization: next-i18next, react-i18next (Spanish, English, Portuguese)
- Calendar: FullCalendar 6.x (Study Planner)
- Session Recording: rrweb
- Serverless: Netlify Functions (cron jobs)

## Repository Structure

```
SofLIA-Learning/
├── apps/
│   ├── web/              # Frontend (Next.js)
│   │   └── src/
│   │       ├── app/      # Next.js App Router
│   │       ├── features/ # Business domain features
│   │       ├── core/     # Core services & stores
│   │       ├── lib/      # Infrastructure utilities
│   │       └── shared/   # Reusable components & utilities
│   └── api/              # Backend (Express)
│       └── src/
│           ├── features/ # Business domain features
│           ├── core/     # Middleware & config
│           └── shared/   # Shared types & constants
├── packages/
│   ├── shared/          # Shared code between frontend & backend
│   └── ui/              # Shared UI components (@aprende-y-aplica/ui)
├── netlify/
│   └── functions/       # Serverless cron jobs (lesson inactivity)
├── supabase/
│   ├── config.toml      # Supabase configuration
│   └── migrations/      # Database migrations (40+)
└── docs/                # Documentation
```

## Commands

```bash
# Development
npm run dev          # Start both frontend (:3000) and backend (:4000) concurrently
npm run dev:web      # Start frontend only
npm run dev:api      # Start backend only

# Building
npm run build        # Build all workspaces
npm run build:web    # Build frontend only
npm run build:api    # Build backend only
npm run build:packages  # Build shared packages

# Code Quality
npm run type-check   # Type check all workspaces
npm run lint         # Lint all workspaces

# Bundle Analysis (Frontend)
npm run analyze --workspace=apps/web           # Analyze all bundles
npm run analyze:server --workspace=apps/web    # Server bundle only
npm run analyze:browser --workspace=apps/web   # Browser bundle only

# Workspace-specific operations
npm install <package> --workspace=apps/web     # Install in web app
npm install <package> --workspace=apps/api     # Install in API
npm run <command> --workspace=apps/web         # Run command in specific workspace

# Clean build (Windows)
npm run clean --workspace=apps/web && npm run build --workspace=apps/web
```

## Architecture

### Screaming Architecture

The codebase follows "Screaming Architecture" principles - organized by business features, not technical layers.

**Feature Structure:**

```
features/[feature-name]/
├── components/     # Feature-specific components
├── hooks/          # Feature-specific hooks
├── services/       # Feature-specific services
├── types.ts        # Feature-specific types
└── index.ts        # Barrel exports
```

**Main Features (22 modules):**

- `admin/` - Admin panel for platform and company management
- `ai-directory/` - AI applications and prompts catalog
- `auth/` - Authentication, SSO (Google/Microsoft) and registration
- `business-panel/` - Business admin panel (org admin) + business user dashboard
- `communities/` - Community management, posts, and interactions
- `courses/` - Course management and learning content
- `instructor/` - Instructor-specific features and content
- `landing/` - Landing page components (header, footer, sections)
- `lia/` - SofLIA AI assistant (chat interface, history, hooks)
- `news/` - News articles and reading statistics
- `notifications/` - User notification system
- `onboarding/` - User onboarding flows
- `profile/` - User profile management
- `purchases/` - Purchase history and management
- `reels/` - Short-form video content (Reels)
- `scorm/` - SCORM 1.2/2004 e-learning content integration
- `skills/` - Skills catalog and tracking
- `study-planner/` - AI-powered study planning and scheduling
- `subscriptions/` - Subscription and payment management
- `tours/` - Guided onboarding tours
- `video-tracking/` - Video progress and lesson tracking

### Dependency Rules

```
features/  → Can import from core/ and shared/
core/      → Can import from shared/
shared/    → Cannot import from anywhere (pure infrastructure)
```

### Frontend Organization (apps/web/src/)

| Directory   | Purpose                                                                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`      | Next.js App Router pages (Server Components by default)                                                                                                                                                                      |
| `features/` | Business domain features (self-contained, 22 modules)                                                                                                                                                                        |
| `core/`     | Cross-cutting logic: stores (Zustand), providers, services/api.ts (Axios), i18n                                                                                                                                              |
| `lib/`      | Infrastructure: supabase/, openai/, lia/, lia-context/, schemas/, auth/, rate-limit/, oauth/, rrweb/, scorm/, analytics/, cache/, sanitize/, upload/, validation/, middleware/, logger/, subscription/, holidays/, nanobana/ |
| `shared/`   | Pure infrastructure: generic hooks (useDebounce), utility functions                                                                                                                                                          |

### Backend Organization (apps/api/src/)

**Note:** Backend API routes are currently placeholder endpoints. Most backend logic is handled by Supabase directly via Next.js API routes.

| File Pattern              | Purpose                         |
| ------------------------- | ------------------------------- |
| `[feature].controller.ts` | HTTP request handlers           |
| `[feature].service.ts`    | Business logic                  |
| `[feature].routes.ts`     | Route definitions               |
| `[feature].types.ts`      | DTOs and Zod validation schemas |

## Important Patterns

### Supabase Integration

- Browser: `createClient()` from `lib/supabase/client.ts`
- Server Components: `createServerClient()` from `lib/supabase/server.ts`
- Protected routes: middleware in `lib/supabase/middleware.ts`
- Database types: `lib/supabase/types.ts`

### API Communication

- Frontend uses `core/services/api.ts` (Axios with interceptors and token refresh)
- API base URL: `http://localhost:4000/api/v1`
- **Do NOT use webhooks** - Always use REST API endpoints

### Path Aliases

```typescript
@/*           → apps/web/src/*
@/features/*  → apps/web/src/features/*
@/core/*      → apps/web/src/core/*
@/lib/*       → apps/web/src/lib/*
@/components/*→ apps/web/src/shared/components/*
@/utils/*     → apps/web/src/shared/utils/*
@/hooks/*     → apps/web/src/shared/hooks/*
@shared/*     → packages/shared/src/*
```

## Internationalization (i18n)

Supports **Spanish (default)**, **English**, and **Portuguese** via `next-i18next` + `react-i18next`.

- Translation files: `apps/web/public/locales/{es,en,pt}/common.json`
- Keep keys consistent across all three languages
- `I18nProvider` is mounted in `src/app/layout.tsx`

```typescript
// In components
import { useTranslation } from "react-i18next";
const { t } = useTranslation("common");

// Language switching
import { useLanguage } from "@/core/i18n/I18nProvider";
const { language, changeLanguage } = useLanguage(); // 'es' | 'en' | 'pt'
```

## Styling & Design System

### SOFIA Color Palette (CSS Variables in globals.css)

**CRITICAL:** Always use Tailwind classes or CSS variables. NEVER hardcode hex colors like `#0F1419` or `#1E2329`.

```css
/* Primary Colors */
--color-primary: #0a2540 /* Azul Profundo - Technology + trust */
  --color-accent: #00d4b3 /* Aqua - Learning + Living AI */
  --color-bg-dark: #0f1419 /* Dark mode background */ --color-bg-light: #ffffff
  /* Light mode background */ /* Secondary Colors */ --color-success: #10b981
  /* Green - Achievement */ --color-warning: #f59e0b /* Amber - Alert */
  --color-error: #ef4444 /* Red - Error */ /* Gray Scale (Neutral) */
  --color-gray-50: #f8fafc --color-gray-100: #f1f5f9 --color-gray-200: #e9ecef
  /* Light gray - Structure */ --color-gray-500: #6c757d
  /* Dark gray - Typography */ --color-gray-800: #1e2329
  /* Dark gray with blue tint */ --color-gray-900: #0f1419
  /* Main dark background */;
```

### Tailwind Class Mapping

**Light Mode:**

- Background: `bg-white`, `bg-gray-50`, `bg-gray-100`
- Text: `text-gray-900` (primary), `text-gray-600` (secondary)
- Borders: `border-gray-200`

**Dark Mode:**

- Background: `bg-gray-900`, `bg-gray-800`
- Text: `text-white` (primary), `text-gray-400` (secondary)
- Borders: `border-white/10`

**Dynamic Colors (from OrganizationStylesContext):**

- Use `primaryColor` and `accentColor` for branded elements
- Apply via inline styles: `style={{ backgroundColor: primaryColor }}`
- Use for gradients: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`

### Component Patterns

**Architecture:**

- Mobile-first responsive design (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- Component modularity: Break large components (>300 lines) into smaller pieces
- Extract business logic into custom hooks (`use[Feature]Logic.ts`)
- One component = one responsibility

**Styling Best Practices:**

- Use `cn()` from `shared/utils/cn.ts` for className merging
- Prefer Tailwind classes over inline styles
- Only use inline styles for dynamic colors (primaryColor, accentColor)
- Framer Motion for animations
- Radix UI and Headless UI for accessible components

**Theme Management:**

- Access theme via `useThemeStore()` from `@/core/stores/themeStore`
- `resolvedTheme` returns 'light' or 'dark'
- Components should support both themes

### Data Visualization

- **Nivo** (@nivo/\*): Complex, customizable visualizations
- **Recharts**: Simple, performant charts
- **Tremor** (@tremor/react): Business dashboards

## Database Schema (Supabase)

Migrations in `supabase/migrations/` (40+). Full types in `lib/supabase/types.ts`.

**Key tables by domain:**

- **Users & Orgs**: `usuarios`, `organizations`, `organization_users`, `organization_invitations`
- **Hierarchy (optional)**: `organization_regions`, `organization_zones`, `organization_teams`, `hierarchy_chats`, `hierarchy_chat_messages`
- **Courses**: `cursos`, `modulos`, `lecciones`, `actividades`, `user_lesson_progress`, `lesson_tracking`
- **Study Planner**: `study_plans`, `study_sessions`, `study_preferences`, `calendar_integrations`
- **SofLIA**: `lia_conversations`, `lia_messages`, `lia_personalization`
- **Certs & Skills**: `certificates`, `skills`, `user_skills`
- **Community**: `comunidades`, `comunidad_posts`, `comunidad_comentarios`, `news`, `reels`, `workshops`
- **AI Directory**: `ai_apps`, `ai_prompts`, `prompt_favorites`

## Development Guidelines

### TypeScript

- Strict typing enabled (`strict: true`)
- Avoid `any`, prefer `unknown` if needed
- Define interfaces for all props and data structures

### Component Guidelines

**General Rules:**

- Use Server Components by default, add `'use client'` only when needed
- Client Components required for: event handlers, browser APIs, React hooks, context consumers
- One component = one responsibility
- Break components >300 lines into smaller, focused components

**Modular Component Architecture (Example: HierarchyChat):**

```
features/business-panel/components/hierarchy/HierarchyChat/
├── index.ts                    # Barrel exports
├── types.ts                    # Shared types and constants
├── HierarchyChat.tsx          # Main component (orchestrator)
├── ChatHeader.tsx             # Sub-component: Header
├── ChatMessages.tsx           # Sub-component: Messages list
├── ChatMessage.tsx            # Sub-component: Individual message
├── ChatInput.tsx              # Sub-component: Input area
├── EmojiPicker.tsx            # Sub-component: Emoji selector
├── FilePreview.tsx            # Sub-component: File preview
├── ImageModal.tsx             # Sub-component: Image modal
└── hooks/
    └── useChatLogic.ts        # Custom hook with business logic
```

**Benefits of this structure:**

- **Maintainability**: Easy to locate and modify specific features
- **Reusability**: Sub-components can be used independently
- **Testing**: Smaller components are easier to test
- **Performance**: Easier to optimize with React.memo
- **Collaboration**: Multiple developers can work on different sub-components

### Naming Conventions

- Files: kebab-case (`user-profile.tsx`)
- Components: PascalCase (`UserProfile`)
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE

### User Roles

| Role           | Description           | Routes                                                                  |
| -------------- | --------------------- | ----------------------------------------------------------------------- |
| `Admin`        | Platform super admin  | `/admin/*`                                                              |
| `Business`     | Organization admin    | `/business-panel/*`                                                     |
| `BusinessUser` | Organization employee | `/business-user/*` (pages in app/, logic in `features/business-panel/`) |

## Environment Variables

See [.env.example](.env.example) for all available variables. Key ones:

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend (.env)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
USER_JWT_SECRET=
```

## Key Files

- `.cursorrules` - Project standards (ALWAYS follow these)
- `lib/supabase/types.ts` - Database schema types
- `apps/web/src/app/layout.tsx` - Root layout with providers
- `core/services/api.ts` - Axios client with interceptors
- `apps/web/src/app/downloads/page.tsx` - Downloads page (latest release, changelog, requirements)
- `netlify/functions/` - Serverless cron jobs (lesson inactivity tracking)
- `supabase/migrations/` - Database migration history

## Common Tasks

### Adding a New Feature

1. Create `features/[feature-name]/` with `components/`, `hooks/`, `types.ts`, `index.ts`
2. Export from `index.ts` as barrel export
3. Import via `@/features/[feature-name]`

### Adding a Next.js API Route

1. Create in `apps/web/src/app/api/[route]/route.ts`
2. Use Zod for validation schemas
3. Use Supabase client for database operations

## Testing URLs

- Frontend: http://localhost:3000
- Backend Health: http://localhost:4000/health
- API Base: http://localhost:4000/api/v1

## SofLIA (AI Assistant)

AI-powered chatbot (formerly "LIA") using OpenAI GPT-4o-mini:

- Feature: `features/lia/` (chat UI, history, hooks)
- Config: `lib/lia/`, `lib/lia-context/`, `lib/openai/`
- Model settings: `CHATBOT_MODEL`, `CHATBOT_MAX_TOKENS`, `CHATBOT_TEMPERATURE`
- Multilingual (ES, EN, PT) with automatic language detection
- Context-aware help: course lessons, study planner, dashboard, general
- Persistent conversation history with editable titles
- Proactive actions in Study Planner (move/delete/create sessions)

```typescript
import { useLIAChat } from "@/features/lia/hooks/useLIAChat";
const { sendMessage, messages, isLoading } = useLIAChat({
  context: "course_lesson",
});
```

## Component Refactoring Guidelines

### When to Refactor a Component

**Size indicators:**

- Component exceeds 300 lines
- Multiple responsibilities in one file
- Difficulty understanding component flow
- Hard to test or maintain

**Refactoring steps:**

1. **Extract business logic** → Create custom hook (`use[Feature]Logic.ts`)
2. **Identify sub-components** → Split by UI sections (Header, Body, Footer, etc.)
3. **Create types file** → Move shared types and constants to `types.ts`
4. **Add barrel export** → Create `index.ts` for clean imports
5. **Update imports** → Change from file import to folder import

**Example: Before refactoring**

```typescript
// ❌ Single monolithic file (1000+ lines)
import { HierarchyChat } from "./HierarchyChat.tsx";
```

**Example: After refactoring**

```typescript
// ✅ Modular structure
import { HierarchyChat } from "./HierarchyChat"; // imports from index.ts
```

### Custom Hooks Pattern

**Extract logic when:**

- Complex state management (5+ useState)
- Multiple useEffect hooks
- Business logic mixed with UI

**Structure:**

```typescript
// hooks/useFeatureLogic.ts
export const useFeatureLogic = (props) => {
  // All state, refs, effects
  const [state, setState] = useState();

  // All business logic functions
  const handleAction = () => {
    /* ... */
  };

  // Return only what components need
  return {
    state,
    handleAction,
    // ... other exposed values/functions
  };
};
```

## Critical Rules

### Architecture & Structure

- **Screaming Architecture** - Organize by features, not technical layers
- **Monorepo workspaces** - Use `--workspace=apps/web` for package operations
- **Component size** - Refactor components over 300 lines into modular structure

### Styling & Colors (CRITICAL)

- **NO hardcoded colors** - NEVER use `#0F1419`, `#1E2329`, etc. in code
- **Use Tailwind classes** - `bg-gray-900`, `text-white`, `border-white/10`, etc.
- **CSS Variables** - Use `--color-primary`, `--color-accent` for dynamic colors
- **Theme support** - All components must support light AND dark mode
- **Organization colors** - Use `primaryColor` and `accentColor` from context for branded elements

### API & Data

- **NO webhooks** - Always use REST API endpoints
- **Supabase direct** - Most backend logic via Supabase, not Express API

### Code Quality

- **Responsive design** - Mobile-first for all components
- **Translations** - Keep es/en/pt files in sync
- **TypeScript strict** - No `any` types, prefer `unknown` if needed
- **Builds** - Ignore TypeScript/ESLint errors (configured for speed)

---

## Claude Code Commands

**Memory & Context:**

- `/remember` - Save information for future conversations (stores in Claude's memory)
- `/clear` - Clear conversation history

**To update this CLAUDE.md file:**

- Just ask Claude to update it directly (e.g., "Update CLAUDE.md with X information")
- Or edit manually: `code CLAUDE.md`
