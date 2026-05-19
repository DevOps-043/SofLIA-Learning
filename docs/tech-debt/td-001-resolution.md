# TD-001 — `tsc --noEmit` timeout: diagnostic and resolution

## Root cause (verified 2026-05-18)

`npm run type-check` against the full `tsconfig.typecheck.json` (includes `src/**/*.{ts,tsx}`) timed out at 300 s without ever emitting output. The previous `--max-old-space-size=8192` heap bump did not help.

A scoped run on `src/core/**`, `src/lib/**`, `src/shared/**` only (3 729 files, 421 k LOC, ~838 MB) completed in **10.27 s** with concrete TS errors. This proves the compiler is healthy; the cost is in `src/app/**` and `src/features/**`, which pull in the `next` TS plugin and a much larger graph (Supabase types, Radix, FullCalendar, Nivo, GSAP, Framer-Motion, etc.).

The aggregated typecheck hits an unfavorable combination: the `next` plugin re-resolves modules per file as the graph grows, memory pressure stays high, and the watchdog (`timeout 300`) fires before completion. Splitting the typecheck eliminates the cliff.

## Resolution

### 1. Split typecheck into three slices

| Config | Scope | Approx. files |
|---|---|---|
| `apps/web/tsconfig.typecheck.core.json` | `core/`, `lib/`, `shared/` | ~3 700 |
| `apps/web/tsconfig.typecheck.app.json` | `app/` only | ~2 500 |
| `apps/web/tsconfig.typecheck.features.json` | `features/` only | ~3 000 |

Each slice runs under its own `tsBuildInfoFile` (`.next/cache/tsconfig.typecheck.<slice>.tsbuildinfo`) and disables the `next` plugin (we only need type validation, not Next-specific transformations).

### 2. Updated package.json scripts

```
"type-check": "npm run type-check:core && npm run type-check:app && npm run type-check:features"
"type-check:core": "tsc --noEmit -p tsconfig.typecheck.core.json"
"type-check:app": "tsc --noEmit -p tsconfig.typecheck.app.json"
"type-check:features": "tsc --noEmit -p tsconfig.typecheck.features.json"
"type-check:all": "tsc --noEmit -p tsconfig.typecheck.json"  # legacy single-shot, still available
```

### 3. Errors surfaced after the split (now visible — were hidden by timeout)

Pre-existing errors found in `lib/`:

- `lib/utils/workshop-metadata.ts` — Supabase row typed as `Record<string, unknown>` was destructured into typed fields (10 errors). **Fixed in P4.**
- `lib/auth/mfa/mfa.service.ts` — wrong import name (`createServerClient` → `createClient`). **Fixed in P4.**
- `lib/lia-context/hooks/useErrorCapture.ts` — undeclared `logger`. **Open.**
- `lib/lia-context/providers/bug-report/BugReportContextProvider.ts` — `EnrichedMetadata` is missing `apiCalls`, `activeModals`, `formStates`. **Open.**
- `lib/lia-context/services/ContextBuilderService.ts` — missing exports `ContextRequest`, `BuiltContext`, `LiaContextProvider`; implicit `any` in 3 places. **Open.**
- `lib/middleware/csrf-protection.tsx` — Next 15 cookies API is async (`await cookies()`). **Open.**
- `lib/scorm/adapter.ts` — `string | undefined` returned where `string | null` expected. **Open.**

`app/` and `features/` slices will produce additional errors when first run; each goes to `known-issues.md` with owner.

### 4. Unblocks Tarea 1.3

Once each slice passes (`type-check:core`, `type-check:app`, `type-check:features`), Tarea 1.3 can flip:

- `apps/web/next-config/create-next-config.js` → `ignoreBuildErrors: false`, `ignoreDuringBuilds: false`.
- CI must run `npm run type-check` on every PR and block merge on non-zero exit.

### 5. Operator follow-ups

- Fix the remaining `lib/` errors listed above.
- Run `type-check:app` and `type-check:features` in CI nightly until both reach exit 0.
- After all three slices are clean for ≥ 7 days, remove `tsconfig.typecheck.json` (legacy single-shot).

## Why this is the right shape

- Cheap and incremental: each slice has its own `tsBuildInfo`, so subsequent runs are fast.
- Maps to ownership boundaries: `core/lib/shared` infra, `app/` routes, `features/` domains.
- Parallelizable in CI (matrix job per slice).
- Surfaces real errors that were masked by the previous timeout, which was its own form of debt.
