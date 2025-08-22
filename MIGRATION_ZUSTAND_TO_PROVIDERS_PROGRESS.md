## Migration: Zustand -> React Providers (reducers + immer)

This document is the authoritative, actionable migration plan and progress tracker for replacing the Zustand stores with vanilla React providers backed by reducers using `immer`.

High-level goal

-   Replace Zustand singletons with typed React Context providers that use `useReducer` + `immer`.
-   Persist provider state to localStorage (initial) with a clear migration/hydration strategy; optionally switch to IndexedDB later for large data.
-   Support offline-first queued updates with temp IDs and reconciliation after server writes.
-   Export reducers and action types for unit testing.
-   Avoid `any` and unsafe casts; fix types first when necessary.

Important constraints (from the request)

-   Focus solely on porting logic/state/manipulation out of `@/store` into providers — we will update components later.
-   Remove runtime adapters unless needed for tests; if used temporarily, they must be explicitly registered and documented as temporary.
-   Providers and reducers must be testable in isolation and together.

Checklist (Phase 0 -> Phase 3)

Phase 0 — discovery & types (high priority)

-   [ ] Inventory `src/store/*` Zustand stores and exported public APIs (hooks, getOrCreateXStore, selectors). (Do this first.)
-   [ ] Audit `src/types` and fix missing/incorrect types so reducers can be strictly typed (no `any`).

Phase 1 — provider scaffolding & reducers

-   [ ] Create `src/providers/*` (AppProvider, BoardProvider, ListProvider, CardProvider, QueueProvider, TempIdMapProvider, AuthProvider, OrganizationProvider, UiProvider, SyncErrorProvider).
-   [ ] Implement reducers under `src/providers/reducers/*` and export them for unit tests. Keep reducers pure and fully typed.
-   [ ] Implement `usePersistedReducer` util (hydrates from localStorage and persists on state changes). Keep hydrator tolerant (graceful migration of storage format).
-   [ ] Add minimal runtime adapters only if tests need non-React access; keep adapters removable. Document adapter usage.
-   [ ] Add unit tests for every reducer (happy path + 1-2 edge cases each).

Phase 2 — queue, temp IDs, reconciliation

-   [ ] Implement queue reducer + helpers: enqueue, squash, remove, and apply-success reconciliation.
-   [ ] Implement `TempIdMap` reducer for mapping tempId -> realId; expose reconcile action.
-   [ ] Implement helper to reconcile queues and domain stores when a tempId resolves.
-   [ ] Add integration tests that mount providers together and simulate: create (tempId -> server id), update queued actions, squash behavior, and reconciliation.

Phase 3 — integration & cleanup

-   [ ] Migrate small slices of UI to new provider hooks incrementally (one page/feature at a time). Keep Zustand stores available but marked deprecated.
-   [ ] Remove Zustand files and dependency after coverage by providers & tests.
-   [ ] Finalize persistence strategy (optionally migrate large data to IndexedDB) and remove temporary adapters.

Contracts (reducer & provider expectations)

-   Inputs: actions with exact discriminated union types. No `any`.
-   Outputs: new state object (pure reducer) following exported state types.
-   Provider surface: `useXStore()` hook returning { state, action methods } where action methods dispatch typed actions.
-   Persistence: providers will read from localStorage synchronously on mount to produce initial state (hydration), then persist with debounced writes.

Testing strategy

-   Unit tests: each reducer exported and tested with pure state inputs (jest). Tests must validate invariants: id replacement, squash logic, enqueue/remove, and persistence helpers.
-   Integration tests: mount `AppProvider` with real reducers using `react-test-renderer` or `@testing-library/react` (no browser required) to assert cross-provider flows: create -> queue -> reconcile.
-   E2E: Playwright tests can validate the end-to-end UX after components are migrated.

Key engineering notes and edge cases

-   Temp ID collisions: use a UUID namespace for client-temp ids; ensure tempId collisions are resolved on reconcile.
-   Queue squashing: squash by item id + action type; new enqueue should replace previous queued action of the same type for same item.
-   Offline writes: persist queue separately from domain stores so queued actions can be replayed after reload.
-   Inter-store coordination: prefer a small orchestrator (store-bridge) that providers can register with on mount. If possible, avoid global singletons — adapters must be explicitly registered and removed.
-   Hydration races: providers must support a sync hydration step from localStorage so UI that mounts afterwards sees consistent initial state. Do not rely on async initialization for critical state.

Temporary vs permanent adapter decision

-   Default: do NOT add runtime adapters. Only add them temporarily if a small set of non-React callers (scripts/tests) need to exercise providers before components are migrated.
-   If added, implement `registerXAdapter(adapter|null)` and ensure providers register/unregister on mount/unmount (so tests can mount/unmount providers and rely on adapters safely).

Storage keys (recommendation)

-   Use explicit keys per provider, namespaced: `violet-kanban:boards`, `violet-kanban:lists`, `violet-kanban:cards`, `violet-kanban:queue`, `violet-kanban:tempIdMap`.
-   Keep keys stable if reusing prior Zustand persistence keys; provide a small migration helper to convert old keys to new provider shape.

Immediate next steps (what I'll do now if you say "go")

1. Create and commit a concrete Phase 1 PR scaffolding (if not already present): providers + reducers skeletons + `usePersistedReducer` util. Ensure reducers are exported.
2. Add unit tests for existing reducers in `src/providers/reducers/*` and make them pass. (This validates current behavior.)
3. Implement `TempIdMap` reconcile helper and a small integration test that mounts `AppProvider` and simulates create->reconcile.

Suggested timeline and sizing (rough)

-   Phase 0 (types & inventory): 0.5–1 day
-   Phase 1 (scaffold + unit tests): 1–2 days
-   Phase 2 (queue + reconcile + integration tests): 2–3 days
-   Phase 3 (migration & cleanup): 1–2 days (depends on app size)

Acceptance criteria

-   Reducers exported and covered by unit tests (>= 90% branch coverage for reducer logic).
-   Integration tests demonstrating queue->persist->reconcile flow.
-   Components using new hooks behave identically to prior Zustand-backed behavior after migration.

Notes & assumptions

-   This plan assumes `src/types/*` are the single source of truth; if types are incomplete, the type fixes are the first step.
-   We will not attempt to maintain the Zustand code; it will be removed during Phase 3.
-   Keep PRs small and focused: reducer tests first, then provider scaffolding, then reconcile logic, then component migration.

Progress tracking

-   Current repo state (checked while writing): a provider scaffold exists under `src/providers` with reducers present and `AppProvider` implemented. Some adapters exist — prefer removing them unless you want them kept for tests.

Questions for you

-   Do you want me to remove the adapter code now or leave it until integration tests are in place? (Recommendation: keep a tiny adapter only for tests, then remove during Phase 3.)
-   Confirm persistence target: `localStorage` for Phase 1, then optional `IndexedDB` in Phase 3? (Assuming Yes.)

If you confirm, I'll start by exporting all reducers (if not already exported), adding unit tests for each reducer, and creating a small integration test that demonstrates tempId reconciliation.

— Migration tracker

Commit progress and per-task status will be recorded by updating this file in subsequent commits.
