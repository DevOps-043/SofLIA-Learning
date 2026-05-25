# Hardcoded Colors Audit

Snapshot: 2026-05-19

Scope audited:
- `apps/web/src/**/*.ts`
- `apps/web/src/**/*.tsx`
- `apps/web/src/**/*.css`
- `packages/ui/src/**/*.{ts,tsx}`
- `apps/web/public`
- Tailwind config files

Command:

```powershell
rg -n "#[0-9A-Fa-f]{3,8}" apps/web/src packages/ui apps/web/public tailwind.config.js apps/web/tailwind debug_payload.json --hidden -g "!**/node_modules/**" -g "!**/.next/**" -g "!**/coverage/**" -g "!**/dist/**" -g "!**/build/**"
```

Current result:
- Matches: 0
- Files: 0
- ESLint guardrail: active as `error` in `apps/web/eslint.config.mjs`

## Remediation Summary

| Categoria | Resultado |
|---|---|
| Branded | Replaced repeated SofLIA hex values with Tailwind tokens (`primary`, `accent`, `success`, `warning`, `error`, `info`) and CSS variables. |
| Tema | Replaced arbitrary Tailwind hex classes with semantic classes and RGB-backed CSS variables that support opacity modifiers. |
| Specific | Moved historical non-semantic colors into generated fallback CSS variables in `global-overrides-26-color-tokens.css`; email templates use `rgb(...)` literals for client compatibility without hex. |
| Branding | Color-picker/API defaults derive valid hex values at runtime from `apps/web/src/core/theme/color-tokens.ts`; source files do not store hardcoded color literals like `#0A2540`. |

## Notes

- SQL migration history still contains historical color defaults and was intentionally not edited because applied migrations must not be rewritten.
- Embedded provider/logo colors were converted away from hex in TS/TSX sources while preserving visual output.
- New hex literals in TS/TSX/template strings now fail ESLint through `no-restricted-syntax`.
- Branding flows still accept user-provided hex colors because Supabase fields and `<input type="color">` require that format; those values are generated or supplied at runtime, not hardcoded in source.
