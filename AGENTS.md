# AGENTS.md

## Commands

```bash
pnpm dev                 # Dev server (Vite, port 5173)
pnpm build               # Typecheck + production build (tsc && vite build)
pnpm lint                # ESLint (ts/tsx only, 0 warnings tolerated)
pnpm format              # Prettier on src/**
pnpm test                # Vitest (watch mode by default)
pnpm test -- --run       # Single run, exits
pnpm test -- --run src/features/auth/services/auth.service.test.ts  # Single file
pnpm tsc --noEmit        # Typecheck only (no dedicated script; CI runs this)
pnpm storybook           # Storybook dev server on port 6006
```

CI order: `tsc --noEmit` → `lint` → `test`. All three must pass before merge to `master` or `develop`.

## Architecture

- **React 19 + TypeScript 5.9 + Vite 7** SPA with Ant Design 6 for UI and Tailwind CSS for utility styles.
- **Zustand 5** for state; auth store uses `persist` middleware writing to `localStorage` key `centra-auth-storage`.
- **Axios** instance at `src/api/api.config.ts` reads `VITE_API_URL` from env. Request interceptor injects JWT from the persisted auth store; 401 responses clear storage.
- **Role-based routing** in `src/router/router.tsx`. Two roles: `SUPER_ADMIN` (→ `/admin`), `STORE_ADMIN` (→ `/tienda`). `ProtectedRoute` gates by role. Role config lives in `src/router/roles.config.ts`.

## Path Aliases

Configured in both `vite.config.ts` and `tsconfig.json`:

| Alias | Maps to |
|---|---|
| `@/` | `src/` |
| `@features/` | `src/features/` |
| `@components/` | `src/components/` |
| `@shared/` | `src/shared/` |

## File Conventions

- **Feature folders**: `src/features/{domain}/{ComponentName}/` contains `ComponentName.tsx`, `ComponentName.test.tsx`, optional `ComponentName.stories.tsx`, and `index.ts` barrel export.
- **Services**: `src/features/{domain}/services/{name}.service.ts` with co-located `.service.test.ts`.
- **Interfaces**: feature-specific in `src/features/{domain}/interfaces/`; shared entities in `src/entities/`; shared API types in `src/interfaces/`.
- **Layouts**: `src/layouts/{Name}/` with component, styles file, story, test, and barrel.
- **Zustand stores**: `src/store/{name}.store.ts` with co-located `.store.test.ts`.

## Testing

- **Vitest 4** with `jsdom` environment. Globals enabled — do not import `describe`/`test`/`expect`/`vi` from vitest (they are global).
- **Setup file** `src/tests/setup.ts` mocks `window.matchMedia` and `ResizeObserver` for Ant Design compatibility.
- **@testing-library/react** + `@testing-library/user-event` for component tests. Use `userEvent.setup()` pattern.
- **Mocking**: `vi.mock()` for modules (react-router-dom, stores, api). Tests mock the Axios instance as `vi.mock('@/api/api.config')`.
- **No real API calls** in tests; all HTTP is mocked.

## Prettier

```
semi: true, tabWidth: 4, printWidth: 100, singleQuote: true, trailingComma: "es5"
```

## Design System

- Ant Design theme customized via `src/design-system/theme.ts` and `src/design-system/tokens.ts`.
- `CentraThemeProvider` wraps the app (and Storybook) — do not add separate AntD `ConfigProvider` instances.
- Brand colors defined as `centra.*` in both Tailwind config and AntD tokens. Primary: `#093764`.

## TypeScript Quirks

- `tsconfig.app.json` enables `verbatimModuleSyntax` and `erasableSyntaxOnly` — use `import type` for type-only imports; do not use `enum` or `namespace` (use `const` objects or union types instead).
- `build` script runs `tsc` before `vite build`, so type errors block production builds.

## Environment

- `VITE_API_URL` in `.env` — note the leading space in the default value; trim or fix when setting real values.
- Auth token persisted as `centra-auth-storage` in localStorage (Zustand persist).

## Language

Project UI and code comments are in Spanish. User-facing strings (validation messages, labels) are Spanish.
