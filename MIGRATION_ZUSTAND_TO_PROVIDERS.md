Migration plan: Replace Zustand stores with vanilla React Providers using reducers and immer

Goal

-- Replace Zustand-based singletons in `src/store` with React Context Providers that use reducers and immer to manage state.
-- Preserve existing hook-like APIs for components where practical, but implement them with provider-backed hooks and reducers.

-   Persist state to localStorage or indexedDB (offline-first). Queue offline actions and reconcile temp IDs after server responses.
-   Remove reliance on Zustand singletons to avoid server/client initialization mismatch and integration/loading race conditions.

Checklist

-   [ ] Inventory existing stores and exported APIs (done)
-   [ ] Define reducer state shapes and action types for each store (boards, lists, cards, queue, tempIdMap, auth, orgs, ui, syncErrors)
-   [ ] Create React Provider components and hooks that mirror prior API but are backed by reducers/immer
-   [ ] Implement persistence layer (localStorage first, optional indexDB later)
-   [ ] Migrate inter-store operations (e.g. removing lists when board removed) into coordinated reducers or a small orchestration layer
-   [ ] Replace usages across codebase incrementally; provide adapters to call old `getOrCreateXXXStore()` from non-React code where needed
-   [ ] Add tests and run smoke tests
-   [ ] Remove Zustand dependency after full migration

High-level approach

1. Minimal API compatibility

    - Create `providers/` with `AppProvider`, `BoardProvider`, `ListProvider`, `CardProvider`, `QueueProvider`, `TempIdMapProvider`, `AuthProvider`, `OrganizationProvider`, `UiProvider`, `SyncErrorProvider`.
    - Each provider exposes a hook `useBoardContext()` (internal) and a public `useBoardStore()` matching the previous store's hook shape as far as possible (selectors via functions).
    - For non-React code that previously used `getOrCreate*Store()` and StoreApi, provide small adapter functions that access an internal runtime singleton or throw informative error if not initialized. Prefer to migrate non-React code to use hooks where possible.

2. Reducers + Immer

    - For each domain (boards, lists, cards, queue, temp mapping), define an Action union and a reducer function that uses `immer`'s `produce` helper to create immutable updates succinctly.
    - Keep action types strict and typed; avoid `any` and casts. If existing app types are incompatible, fix types first in small PRs.

3. Persistence

    - Implement a lightweight persistence middleware used by providers: serialize state to `localStorage` under names matching current persist keys (e.g., `violet-kanban-board-storage`) so existing persisted data can be loaded.
    - Provide a `usePersistedReducer` hook which hydrates initial state from storage and persists diffs. For large or structured data, offer an indexDB-backed implementation later.

4. Queue/Sync behavior

    - Keep the queue semantics: enqueue actions, squash by id+type, mark stale when server indicates newer data.
    - On create actions, assign `tempId` and store mapping in `TempIdMap` reducer. After successful server creation, dispatch an action to reconcile `tempId` across boards/lists/cards and queues.
    - Implement conflict detection utilities and keep `stale*Actions` sets in the `App` or `Queue` reducer as before.

5. Inter-store coordination
    - Where current stores call other store's getState (non-React usage), create a small in-memory adapter that providers register into at initialization time. This will let code like queue handling still call `addBoard` without being in React.
    - Prefer to migrate cross-cutting logic into a centralized orchestrator (e.g. `storeBridge`) that can call provider dispatchers safely.

Files to add (initial)

-   src/providers/BoardProvider.tsx
-   src/providers/ListProvider.tsx
-   src/providers/CardProvider.tsx
-   src/providers/QueueProvider.tsx
-   src/providers/TempIdMapProvider.tsx
-   src/providers/AuthProvider.tsx (thin wrapper)
-   src/providers/OrganizationProvider.tsx
-   src/providers/UiProvider.tsx
-   src/providers/SyncErrorProvider.tsx
-   src/providers/AppProvider.tsx (top-level composition)
-   src/store/adapters.ts (runtime adapters for non-React code)
-   src/utils/persist.ts (localStorage + optional indexedDB)
-   MIGRATION_ZUSTAND_TO_PROVIDERS.md (this file)

Phased migration plan

Phase 1 (safe, incremental)

-   [ ] Implement providers for Board, List, Card, TempIdMap, Queue with reducers and persistence.
-   [ ] Provide `useXStore()` hooks that replicate the previous `useXStore` interface for components.
-   [ ] Add `initializeAdapters()` that registers provider dispatch APIs for non-React callers; wire into provider mount.
-   [ ] Start migrating components to import new hooks rather than Zustand hooks. Keep Zustand store files untouched for now and add deprecation notices.

Phase 2 (integration)

-   [ ] Migrate queue orchestration and inter-store logic from Zustand-based files into providers or orchestrator.
-   [ ] Migrate auth/organization/ui stores to providers.
-   [ ] Run integration tests and smoke test offline flows.

Phase 3 (cleanup)

-   [ ] Remove Zustand-specific code and dependencies.
-   [ ] Refactor types where necessary to remove casts and any usages.
-   [ ] Optional: replace localStorage with indexedDB for large payloads and improve sync resiliency.

Risks & mitigations

-   Race conditions between provider initialization and non-React code: mitigate by providing explicit `initializeAdapters()` that must be invoked by the top-level `AppProvider` when mounted on client. For SSR, providers should hydrate safe defaults.
-   Persist format differences: use the same storage keys where practical and write graceful hydrators that can migrate values.
-   Type incompatibilities: if types are inconsistent, create a small PR to adjust types first as a dependency.

Next dev tasks (short-term)

1. Add provider scaffolding for Board/List/Card/Queue/TempIdMap (this branch).
2. Implement `usePersistedReducer` util and `persist` loading from existing storage keys.
3. Wire `AppProvider` to mount providers in `src/app/layout.tsx` or similar client entry.
4. Replace a small component to use new `useBoardStore` and verify behavior.

Understanding of store interactions (how stores should work together)

-   Boards/List/Cards are domain models stored separately. Deleting a board should remove related lists and mark cards as orphaned. Deleting a list should nullify `listId` on related cards.
-   Queue holds pending actions (create/update/delete/move) for each domain. It squashes actions by item id + type and stores timestamp for conflict resolution.
-   TempIdMap maps temporary client-generated ids to server-assigned ids for newly created boards/lists/cards.
-   Queue's `handle*ActionSuccess` replaces tempId with realId, updates maps, and writes final entity to domain stores.
-   Some existing code relies on StoreApi.getState() directly; we'll provide adapters during migration so non-React code continues to function.

Assumptions (explicit)

-   The project uses TypeScript and existing app types in `src/types` are mostly accurate. If they are not, type fixes come first.
-   Persisting to `localStorage` is acceptable initially; indexDB can be added later for larger data.
-   React providers will mount client-side; SSR should not attempt to access runtime-only APIs.

Contact points & ownership

-   This branch: migrate/zustand-to-react-providers
-   Files to review after initial commit: `src/providers/*`, `src/store/adapters.ts`, `src/utils/persist.ts`
