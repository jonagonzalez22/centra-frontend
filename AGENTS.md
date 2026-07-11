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

## Component Library

**Always prefer existing wrappers over raw Ant Design components.** When a needed wrapper does not exist, create it following the project's patterns.

Existing wrappers:
- `Button`, `Input`, `InputField`, `InputPassword`, `InputSearch`, `SelectField`, `Tag`, `Tabs`, `Card`, `Modal`, `Table`, `ActionButton`

### ActionButton and Popconfirm

`ActionButton` wraps its button in a `Tooltip`. This causes Popconfirm to fail — the tooltip captures the click before Popconfirm detects it. Inside `Popconfirm`, use `AntButton` (from `antd`) directly, not `ActionButton`.

### Tables — Mobile-first

Tables use `scroll={{ x: 'max-content' }}` as a safety net. Use `responsive: ['md']` on columns to auto-hide them below the `md` breakpoint (768px). The Table wrapper accepts `size="small"` prop for cleaner layouts inside detail pages.

Pattern:
```tsx
columns={[
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email', responsive: ['md'] },
    // ...
]}
// On the Table component:
<Table scroll={{ x: 'max-content' }} size="small" ... />
```

## Testing

- **Vitest 4** with `jsdom` environment. Globals enabled — do not import `describe`/`test`/`expect`/`vi` from vitest (they are global).
- **Setup file** `src/tests/setup.ts` mocks `window.matchMedia` and `ResizeObserver` for Ant Design compatibility.
- **@testing-library/react** + `@testing-library/user-event` for component tests. Use `userEvent.setup()` pattern.
- **Mocking**: `vi.mock()` for modules (react-router-dom, stores, api). Tests mock the Axios instance as `vi.mock('@/api/api.config')`.
- **No real API calls** in tests; all HTTP is mocked.

Service test pattern (mock API):
```ts
vi.mock('@/api/api.config');
const mockApi = vi.mocked(api) as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
```

## Validation Rules

Rules are centralized in `src/utils/validationRules.ts`. **Always use rules from this utility** rather than hardcoding validation inline in forms.

Available rules:
- `emailRules()` — required + email format
- `passwordRules(min)` — required + min length
- `confirmPasswordRules()` — required + matches password field (uses `getFieldValue`)
- `roleRules()` — required
- `requiredStringRules(field, min, max)` — generic required string
- `storeNameRules()`, `storePhoneRules()` — domain-specific

Custom validator pattern (for rules that need `getFieldValue`):
```ts
({ getFieldValue }) => ({
    validator: (_, value: string) => {
        if (!value || getFieldValue('password') === value) return Promise.resolve();
        return Promise.reject(new Error('Las contraseñas no coinciden.'));
    },
})
```

## Forms — Error Handling Pattern

1. Service catches error → if `apiError.errors` exists: `message.error(apiError.message)` + `onError?.(apiError.errors)` + `throw err`
2. Form catches re-thrown error → `form.setFields(fieldErrors)` to show inline field errors

```ts
// useXxxForm hook
catch (err) {
    const apiError = err as ApiError;
    if (apiError.errors) {
        message.error(apiError.message);
        onError?.(apiError.errors);
        throw err;  // re-throw so the form can catch it
    } else {
        message.error(apiError.message || 'Error message.');
    }
}

// UserForm handleFinish
catch (err) {
    const apiError = err as ApiError;
    if (apiError.errors) {
        const fieldErrors = Object.entries(apiError.errors).map(([field, messages]) => ({
            name: [field], errors: messages,
        }));
        form.setFields(fieldErrors);
    }
}
```

## Modal + Form Pattern

For dual create/edit modals (e.g., `UserModal`, `StoreModal`):

1. Modal receives `open`, `onClose`, `onSuccess`, `storeId`, and optional `user` prop
2. `isEditing = !!user` determines mode and title
3. `Form.useForm()` is created at modal level and passed to child form
4. `useEffect` on `open` → populate fields from `user` or `form.resetFields()`
5. Submit button dispatches native submit event: `formEl.dispatchEvent(new Event('submit', ...))`
6. Modal uses `destroyOnClose={false}` to preserve form state across open/close cycles

Integration: Modal lives in the parent component alongside the table. Parent manages `modalOpen`, `selectedUser` state and passes `refetch` as `onSuccess`.

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

## Entity Quirks

- `User.id` is `number` (not string like `Store.id`). API responses use `number` for user IDs.
- `User.store_id` is `number | null`. Form payloads send `store_id` as `string` — the API handles conversion.
- `User.cash_session` is `CashSession | null` — set automatically after open/close operations.

## Cash Module

Location: `src/features/store/cash/`, page at `src/pages/store/cash/`.

- **Entity**: `CashSession` in `src/entities/CashSession.ts` — fields: `id`, `status` (`'open'` | `'closed'`), `opening_amount`, `real_amount`, `closing_amount`, `notes`, `opened_at`, `closed_at`, `opened_by`, `closed_by`.
- **Service**: `CashService` in `services/cash.service.ts` — `getCurrent()` (GET), `open(data)` (POST), `close(cashSessionId, data)` (PATCH). Endpoints in `src/constants/api/endpoints.ts` under `STORE.CASH`.
- **Hook**: `useCashSessionForm` in `hooks/useCashSessionForm.ts` — wraps API calls, updates Zustand store via `setCashSession`, and directly writes to `localStorage` key `centra-auth-storage` for immediate persistence (Zustand v5 persist middleware may not flush synchronously).
- **CashSession lives inside `user` object** in the Zustand auth store (not as a separate store property). Updated via `setCashSession(session)` which does `set(state => ({ user: { ...state.user, cash_session: session } }))`.
- **Page pattern**: Orchestrator `CashPage.tsx` fetches `CashService.getCurrent()` on mount via `useCallback` + `useEffect`, manages modal open/close state, checks `cash.view`/`cash.open`/`cash.close` permissions. Passes props to presentational `CashPageView.tsx`.
- **Modals**: `OpenCashModal` (fields: `opening_amount`, `notes`) and `CloseCashModal` (fields: `real_amount`, `notes`). Both use `useCashSessionForm` hook with `onSuccess` callback that closes modal and triggers `refetch()`.
- **Permissions**: Feature `'cash'` in `FeatureCode`, permissions `cash.view` (page access), `cash.open` (open button), `cash.close` (close button).
- **Roles**: Available to `STORE_ADMIN` and `STORE_USER` roles. Route is under `/tienda/caja` with `FeatureRoute cash` and `PermissionRoute cash.view`.
- **Sidebar**: "Ventas" (icon `ShoppingCart`) as parent → "Caja" (icon `Wallet`) as child item.
- **localStorage**: Direct `localStorage.setItem` after `setCashSession` in the hook to guarantee persistence, since Zustand v5 persist may not write immediately. Key used: `centra-auth-storage`.

Pattern:
```tsx
// Open cash
const session = await CashService.open(data);
setCashSession(session);
persistCashSession(session); // direct localStorage write

// Close cash
const session = await CashService.close(cashSessionId, data);
setCashSession(session);
persistCashSession(session);
```

## Environment

- `VITE_API_URL` in `.env` — note the leading space in the default value; trim or fix when setting real values.
- Auth token persisted as `centra-auth-storage` in localStorage (Zustand persist).

## Language

Project UI and code comments are in Spanish. User-facing strings (validation messages, labels) are Spanish.