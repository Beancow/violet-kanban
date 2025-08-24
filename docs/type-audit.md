Type audit (automatic + manual)

Summary

-   Approximate occurrences of `any`, `unknown`, and `Record<string, unknown>` in `src/`: ~130 matches (see hotspots below).
-   Goal: centralize shared shapes in `src/types`, remove ad-hoc `any`/`unknown` usages, and prefer narrow, exported interfaces/types.

Top hotspots (high priority)

1. `src/providers/helpers.ts` — multiple payload parsing and runtime type checks; currently uses `any`/`unknown` in several places. Critical for action/queue processing.
2. `src/providers/useVioletKanbanHooks.ts` — many `any` uses for create/update payloads. Partially typed already.
3. Provider files using `useReducer(... as any, initial)` — reducers are exported but provider hook call sites often cast to `any` when calling `useReducer`.
4. `src/lib/sentryWrapper.ts` and `src/instrumentation*.ts` — third-party shim code uses `any` liberally.
5. Server-side data converters (`src/lib/firebase/*`) and API routes — some `unknown` usage when parsing Firestore data.
6. Tests & helpers — some test harness files use `any` for convenience.

Opportunities for centralization

-   `src/types/state-shapes.ts` (created) — central reducer state shapes (BoardStateShape, ListStateShape, CardStateShape, QueueStateShape, TempIdMapStateShape).
-   `src/types/provider-apis.ts` (created) — central provider API types (OrganizationApi, AuthApi, SyncErrorApi, UiApi).
-   `src/types/*` already contains `appState.type.ts`, `worker.type.ts`, `violet-kanban-action.ts`, `reducer.type.ts` — these should be the single source of truth for payloads and action shapes.

Next recommended steps

1. Replace `any`/`unknown` uses in `src/providers/helpers.ts` with precise guards and typed unions (SyncAction, VioletKanbanAction, WorkerMessage from `src/types/worker.type.ts`).
2. Remove `as any` uses in providers' `useReducer` calls by using typed reducer function signatures and passing the generic parameter to `useReducer`.
3. Create small adapter types for external 3rd-party shims (Sentry) instead of `any`.
4. Run `npx tsc --noEmit` after each batch to limit change scope.

This audit was generated during an editing session and should be treated as a living doc. See the codebase for exact instances. If you want, I can produce a CSV-style list of every file and match count next.
