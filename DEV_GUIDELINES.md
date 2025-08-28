## Suggested Additions

-   `src/types/worker.ts`  worker message envelope types.
-   `src/types/handlers/index.ts`  handler ctx contracts.
-   `src/stores/interfaces/Store.ts`  common store interfaces (get/add/update/list/subscribe).
-   `src/stores/adapters/inMemoryAdapter.ts`  in-memory adapter used for tests and dev.
-   `src/utils/backoff.ts`  exponential backoff + jitter helper used by queue logic.
-   `src/utils/leaderElection.ts`  simple BroadcastChannel-based leader election helper.

-   `docs/migration.md`  short checklist and steps for converting Provider -> ProviderShim + Store.

## Developer Guidelines (updated)

This file contains the active rules we apply when refactoring or adding sync, worker and persistence code. Keep rules precise and enforceable. When you change these rules, update `scripts/validate-dev-guidelines.js` accordingly.

High-level rules (required)

-   Keep code DRY. Pull repeated logic into small helpers or shared store methods.
-   Handlers must be single-responsibility. One handler per file unless the file is a barrel (`index.*`).
-   Handlers must be passed an explicit small ctx object with everything they need; avoid hidden globals.
-   Centralize types under `src/types/` (use subfolders to mirror `src/` layout).
-   Use runtime guards from `src/types/typeGuards.ts` when narrowing is required. Add new guards there as needed.
-   Do not create new type declarations inline in feature or provider files; add new types to `src/types/` and import them where needed.
-   Prefer using runtime type guards from `src/types/typeGuards.ts` instead of ad-hoc `typeof` checks in handlers; add or extend guards there when needed.
-   When creating new files, place all exported types in the centralized `src/types/` folder (or reuse existing types) — avoid `type`/`export type` declarations outside `src/types/`.

Refactor plan & priorities (recommended incremental workflow)

-   Goal: migrate providers -> provider shims + typed `*StoreDB` implementations with minimal disruption to other work and CI. Types will change a lot during the migration; treat type cleanup as the final step of each feature migration so PRs remain reviewable.

-   High level order of operations for a migration PR:
    1.  Add a minimal `ProviderShim` under `src/providers/shims/` that preserves the current UI surface but delegates to a new store API (the shim can throw NotImplemented for advanced methods initially). This keeps consumers compiling while the store is developed.

2.  Add a small skeleton `*StoreDB` class under the appropriate `src/stores/...` location implementing the minimal methods the shim needs (read/add/update/remove). Export the store's public types from `src/types/` as minimal contracts (see "Keeping type-checking" below).
3.  Wire the shim to the new store in the app entry points, leaving the original provider file in place (or add it to the validator `frozenFiles` list while it is being replaced).
4.  Incrementally move implementation logic from the provider into the store. Keep each PR focused: implement one small behavior at a time and ensure the shim API remains stable.
5.  After the store implementation is feature-complete, replace the original provider (or remove the `frozenFiles` exception) and run a full type + lint pass to locate remaining inline `type` declarations and `typeof` usage.
6.  Final step: centralize types. Move or create complete `export type` declarations under `src/types/` and replace any temporary/ad-hoc type shims. At this point, replace any remaining ad-hoc `typeof` checks with runtime guards in `src/types/typeGuards.ts`.

-   Prefer small, focused PRs that leave the repo compilable and testable. If a single PR would be large, split it into a "skeleton" PR (shim + store skeleton + types stubs) followed by one or more implementation PRs.

-   When you discover a general-purpose helper that operates over multiple data shapes, add a small, exported generic type under `src/types/` (or a helpful subfolder) that documents the helper's expected inputs/outputs (see the `sanitize` helpers for an example). Prefer a generic function signature (e.g. `<T>`) plus a runtime guard in `src/types/typeGuards.ts` instead of ad-hoc `any` casts. This centralizes contracts and makes downstream refactors safer.

    Note: if a function accepts `unknown` (or an untyped parameter) and then immediately casts it (for example `const p = input as SomeType` inside the function), prefer adding a generic parameter or an explicit input type instead of internal casts. Use a signature like `function foo<T>(input: T)` or accept `unknown` and narrow with a runtime guard before returning a typed result — this makes callers opt into the concrete type and reduces unsafe casts inside implementations.

Dependency-first rule

-   When working through a migration, if you discover a shared helper, runtime guard, or type that must change for the migration to succeed, update that dependency first in a small, separate PR (or the first part of your PR): 1. Create the new helper/runtime guard/type under the correct `src/` location (prefer `src/utils/`, `src/types/`, or `src/providers/shims/` depending on intent) as a minimal, well-documented implementation or stub.

2.  Prefer backwards-compatible implementations when it is low-cost (adapter/wrapper pattern) so existing callers continue to work while consumers migrate. Compatibility layers (shims/adapters) are optional — if keeping compatibility would add significant complexity, prefer a small, documented breaking change and provide a short migration plan or a minimal shim as an interim step.
3.  Export a clear, minimal type from `src/types/` for the helper so other modules can import it and compile.
4.  Add tests (unit) for the updated helper if it changes behavior surface, and run `tsc --noEmit` to confirm type stability.
5.  Only after the dependency PR lands (or the first commit in a split PR) continue with the higher-level migration work that depends on it.

This keeps migrations incremental and reduces churn: consumers can adopt the new helper quickly, and the final refactor step can concentrate on moving types and removing legacy code.

Keeping type-checking during migration

-   Create minimal type stubs in `src/types/` for any public surface you are exposing from a new store or shim. Example: if you add `BoardStoreDB.get(boardId)`, add a minimal `src/types/board.ts` with `export type BoardRecord = { id: string; ... }` so imports compile.
-   Avoid scattering `type` declarations across feature files while migrating. If you must add a small local helper type temporarily, put a short `TODO: move to src/types/` comment above it and keep the declaration as small as possible.
-   Prefer `as unknown as T` or small `// @ts-expect-error` annotations only as a last resort and document them with `TODO` comments linking to the migration task. Aim to remove these before finalizing the feature PR.
-   Keep `tsc --noEmit` in your local verification loop and ensure CI runs `tsc --noEmit` as part of the merge checks. If type-errors are numerous during migration, use the `frozenFiles` mechanism (see below) to reduce noise while preserving correct types for new code.

Frozen files and the migration sprint

-   Use the validator's `frozenFiles` list for files that are intentionally being rewritten and would otherwise flood the validator with legacy issues. Files in `report.frozenFiles` are excluded from checks. Document each frozen file with a short PR comment describing why it was frozen and the expected removal timeframe.
-   Do not leave files frozen indefinitely. Each migration PR should either remove a frozen entry or document the migration plan and a target milestone for unfrozen completion.

Types policy (when to move/create types)

-   New types introduced by a migration should live under `src/types/` immediately as minimal stubs (so consumers keep compiling). Mark them `// TODO: expand` where appropriate.
-   When a type grows beyond a trivial shape, extract it fully into `src/types/` before adding additional code that depends on it.
-   Never keep final or shared types inline in provider/feature files; move to `src/types/` before merging the PR.

-   Prefer class-based Stores in `src/stores/` that wrap IndexedDB. Stores should expose a minimal public API and be importable.
-   Provider implementations are being replaced by Provider Shims (`src/providers/*Shim.ts`) that delegate to Stores.
-   No need for backwards-compatibility constraints — break the surface to simplify internals when necessary.

Sync/queue behaviour

-   IndexedDB is the authoritative persistence layer for both live data and queued jobs. Sanitzed/safe auth data should also be persisted in indexDB
-   `QueueStore` (in `src/stores/QueueStore.ts`) is authoritative for queued writes for `board`, `list` and `card` types.
-   Organisation-level changes must bypass queueing and call server actions directly via an API route.
-   Lifecycle of a queued job:
    1. UI handler creates a job (card/list/board) and calls the Orchestrator which adds it to `QueueStore`.
    2. The Orchestrator reads queues on load, when online, or after jobs complete and selects the next job with `pickNextJob`. This should have an instance for each queue and if its length is greater and 0 then the next queue should be cleared in the order of boards, lists and finally cards.
    3. The Orchestrator builds the action via `buildActionJob`, posts via `postAndAwaitJob`, and on success calles the queue store to have it remove the queue item and report back when done. This ensure not more than one job is processed at a time.
    4. On error: increment `retryCount`, set `lastAttempt`, and record the error in `SyncErrorStore`. Sync errors should be squashed, but include the retry count for display.
    5. Queue failures should kick of an incremental backoff to not spam the server.

Handlers & Jobs

-   Each job file in `src/services/syncJobs/` should export a single handler (default export or named `handle*`). If a file must contain multiple small helpers, keep the handler export singular.
-   Jobs should accept a constrained ctx object (queueApi, stores, eventBus, logger). Keep the ctx shape explicit and minimal.
-   Jobs should be small (prefer < 200 lines). If a single responsibility grows, split into multiple job files.

Eventing & cross-tab

-   Use the event bus helpers (`src/utils/eventBus.ts` + `src/utils/eventBusClient.ts`) for in-process coordination (`emitEvent`, `onEvent`).
-   Use a `BroadcastChannel` in stores for cross-tab updates when necessary.

Testing & validator

-   Unit tests are not required for every small change during an early migration, but new public behavior should be covered before landing.
-   The validator `npm run validate:dev-guidelines` checks a small set of project invariants (types folder, stores folder, required file list, `any` occurrences, and multi-export files). Keep the validator up-to-date with new rules.

-   Files listed in the validator's `frozenFiles` output are intentionally excluded from these checks; do not edit or fix those files — they are short-lived exceptions and will be removed during the migration process.

Files & single-responsibility mapping

Below is the initial list of files the project should provide to satisfy these rules (the validator checks these paths). The list is intentionally granular — if a file becomes large, split it and update the validator.

-   `src/types/typeGuards.ts` — runtime guards collection.
-   `src/types/queue.ts` — queue-related types.
-   `src/types/syncError.ts` — sync error type.

-   `src/stores/QueueStore.ts` — class-based queue store, IDB backed, cross-tab notifications.
-   `src/stores/SyncErrorStore.ts` — class-based store for recording sync errors.
-   `src/stores/TempIdMapStore.ts` — map tempId -> realId.
-   `src/stores/BoardStore.ts` — board data store.
-   `src/stores/ListStore.ts` — list data store.
-   `src/stores/CardStore.ts` — card data store.

Persistent DB class naming and pattern

-   Persistent stores that read/write IndexedDB must follow the `*StoreDB` naming convention (for example `QueueStoreDB.ts`, `ToastStoreDB.ts`). These are the classes that encapsulate the IDB wrapper and are the canonical persistence layer.
-   Non-persistent or UI-only stores keep the `*Store` suffix without `DB`.
-   Each persistent `*StoreDB` should have a corresponding Provider Shim under `src/providers/*Shim.ts` which adapts the UI to the store API.
-   `BoardDB` or other legacy DB files should be removed and replaced with `BoardStoreDB.ts` (prefer a fresh, well-typed implementation over in-place edits of large files).

Persistent DB class expectations (examples to add)

-   `src/stores/QueueStoreDB.ts`
-   `src/stores/ToastStoreDB.ts`
-   `src/stores/UiStoreDB.ts`
-   `src/stores/SyncErrorStoreDB.ts`
-   `src/stores/OrganizationStoreDB.ts`
-   `src/stores/AuthStoreDB.ts`
-   `src/stores/BoardStoreDB.ts` (replaces older BoardDB artifacts)

-   `src/providers/BoardProviderShim.ts` — shim that adapts the UI to `BoardStore`.
-   `src/providers/ListProviderShim.ts`
-   `src/providers/CardProviderShim.ts`
-   `src/providers/TempIdMapProviderShim.ts`

Additional provider shims to migrate the remaining providers to the Store/Shim pattern:

-   `src/providers/QueueProviderShim.ts`
-   `src/providers/ToastProviderShim.ts`
-   `src/providers/UiProviderShim.ts`
-   `src/providers/SyncErrorProviderShim.ts`
-   `src/providers/OrganizationProviderShim.ts`
-   `src/providers/AuthProviderShim.ts`

-   `src/services/SyncOrchestrator.ts` — orchestrates queue processing and posts to the worker; small public surface.

-   `src/services/workers/workerPoster.ts` — posts actions to the worker with auth injection.
-   `src/services/workers/workerMessageHandler.ts` — handles incoming messages from the worker and delegates to job handlers.

-   `src/services/syncJobs/pickNextJob.ts` — picks next queue entry.
-   `src/services/syncJobs/buildActionJob.ts` — builds the action to post.
-   `src/services/syncJobs/postAndAwaitJob.ts` — posts and awaits in-flight resolution.
-   `src/services/syncJobs/backoffJob.ts` — calculate & persist backoff metadata.
-   `src/services/syncJobs/actionSuccessJob.ts` — handles ACTION_SUCCESS messages (single handler export).
-   `src/services/syncJobs/errorJob.ts` — handles ERROR/ACTION_ERROR messages.

Validation mapping (which validator checks correspond to which rules)

-   types folder existence -> enforces centralized types
-   stores folder existence -> enforces class-based stores
-   required file list -> enforces single-responsibility and explicit surface
-   `any` scan in `src/services` -> enforces usage of `typeGuards.ts`
-   multi-export file detection -> enforces one handler per file (barrels allowed)

When you request changes that touch these rules, mention which rule(s) you are following in the PR description or commit message.

If you want me to scaffold any of the listed missing files (small, focused impls), tell me which to start with (I recommend `SyncErrorStore` next).

Preferred project file layout

Below is the canonical layout we will adopt. Persistent stores that write to IndexedDB have the `DB` suffix (for example `boardStoreDB`) and live under a `stores/` subtree grouped by concern. Non-persistent helper stores omit the `DB` suffix.

src/
stores/
queues/
boardQueueDB/
boardQueueDB.ts
listQueueDB/
listQueueDB.ts
cardQueueDB/
cardQueueDB.ts
organizations/
organizationsDB/
organizationsDB.ts
organizationData/
boardStoreDB/
boardStoreDB.ts
listStoreDB/
listStoreDB.ts
cardStoreDB/
cardStoreDB.ts
ui/
toastStoreDB/
toastStoreDB.ts
uiStoreDB/
uiStoreDB.ts
errors/
syncErrorDB/
syncErrorDB.ts
helpers/
... small shared helpers
providers/
shims/
BoardProviderShim.tsx
ListProviderShim.tsx
CardProviderShim.tsx
OrganizationProviderShim.tsx
services/
orchestration/
OrchestratorService.ts
jobs/
actionSuccess.ts
backoff.ts
buildAction.ts
pickNext.ts
postAndWait.ts
worker/
workerOut/
workerPoster.ts
workerIn/
workerMessages/
handleSuccess.ts
handleError.ts
utils/
inFlightManager.ts

Notes and conventions

-   DB suffix: Any store that persists to IndexedDB uses the `DB` suffix in its filename and directory (example: `boardStoreDB/boardStoreDB.ts`). These classes should wrap `IDBWrapper` and expose a minimal API.
-   Non-persistent stores: helpers, in-memory caches, or UI state stores should not use the `DB` suffix and live alongside helpers.
-   Provider shims: all React providers that previously exposed reducer-based hooks should have a shim in `src/providers/shims/` that delegates to the new store classes. Shims keep the UI surface stable while migration occurs.
-   One handler per file: job files and message handlers must export a single primary handler. Small helpers may be present in the same file but prefer separate files when responsibilities grow.

Store-specific helpers

-   If a store requires helper modules (for example serialization, conflict-resolution or small adapters), place those helper files inside the corresponding `xQueueDB` or `xStoreDB` folder (for example `src/stores/queues/boardQueueDB/helpers/*` or `src/stores/organizationData/boardStoreDB/helpers/*`). Do not create top-level `stores/helpers` for store-specific logic.

Validator

-   The validator script `scripts/validate-dev-guidelines.js` has been updated to expect the above layout. It will report missing DB stores and missing provider shims so we can prioritize the migration.

If you want me to scaffold a small number of the DB classes and shims, name which ones to start with (I suggest `syncErrorDB`, `toastStoreDB`, and `Queue` queue DBs first).

Suggested additions (concise, non-duplicative)

-   Add small, explicit handler ctx contracts and optional runtime schemas (zod or similar) under `src/types/handlers/` and wire minimal checks into `typeGuards.ts` where needed.  
     Maps to: "Handlers must be passed an explicit small ctx object" and "Use runtime guards".

-   Provide a tiny `Store` interface and an in-memory adapter (dev/test) under `src/stores/adapters/`. This prevents repeated refactors when swapping IDB implementations and enables fast unit tests.  
     Maps to: "Prefer class-based Stores" and "Provider Shims".

-   Define a small worker message envelope type (`src/types/worker.ts`) and runtime guards for it so `workerPoster`/handlers can depend on a single shape.  
     Maps to: "workers/workerPoster" and "workerMessageHandler".

-   Standardize queue items with an idempotency key and explicit `maxRetries`/`poison` policy; persist `nextAttempt` with jittered exponential backoff (helper `backoff.ts`).  
     Maps to: "Queue lifecycle", "backoffJob" and "On error increment `retryCount`".

-   Add leader-election using `BroadcastChannel` (simple claim/renew lock) so only one tab processes queues at a time.  
     Maps to: "BroadcastChannel" and "Orchestrator reads queues".

-   Extend the validator to optionally (config flag) fail on `: any` in critical folders and to warn on files >300 lines so the single-responsibility rule is auto-enforced. Keep defaults lenient for migration branches.  
     Maps to: "The validator" and "One handler per file".

-   Introduce structured sync error codes (enum) and include a `code` field on `SyncError` to make UI grouping and retries clearer.  
     Maps to: "SyncErrorStore" and "record the error in SyncErrorStore".

-   Add a short `docs/migration.md` checklist for converting a Provider → ProviderShim + Store to keep migrations consistent.  
     Maps to: "Provider shims" and "When you change these rules, update the validator".

-   Spell out a security note for IndexedDB persistence: never store raw secret tokens; persist only safe refresh fingerprints or short-lived safe tokens and document the allowed shape.  
     Maps to: "IndexedDB is the authoritative persistence layer".

These are intentionally short, actionable items that avoid restating the existing rules; if you'd like, I can scaffold one or two of them (worker envelope + runtime guard, or Store interface + in-memory adapter) next and wire up a small unit test to demonstrate the pattern.
