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

- Add small, explicit handler ctx contracts and optional runtime schemas (zod or similar) under `src/types/handlers/` and wire minimal checks into `typeGuards.ts` where needed.  
    Maps to: "Handlers must be passed an explicit small ctx object" and "Use runtime guards".

- Provide a tiny `Store` interface and an in-memory adapter (dev/test) under `src/stores/adapters/`. This prevents repeated refactors when swapping IDB implementations and enables fast unit tests.  
    Maps to: "Prefer class-based Stores" and "Provider Shims".

- Define a small worker message envelope type (`src/types/worker.ts`) and runtime guards for it so `workerPoster`/handlers can depend on a single shape.  
    Maps to: "workers/workerPoster" and "workerMessageHandler".

- Standardize queue items with an idempotency key and explicit `maxRetries`/`poison` policy; persist `nextAttempt` with jittered exponential backoff (helper `backoff.ts`).  
    Maps to: "Queue lifecycle", "backoffJob" and "On error increment `retryCount`".

- Add leader-election using `BroadcastChannel` (simple claim/renew lock) so only one tab processes queues at a time.  
    Maps to: "BroadcastChannel" and "Orchestrator reads queues".

- Extend the validator to optionally (config flag) fail on `: any` in critical folders and to warn on files >300 lines so the single-responsibility rule is auto-enforced. Keep defaults lenient for migration branches.  
    Maps to: "The validator" and "One handler per file".

- Introduce structured sync error codes (enum) and include a `code` field on `SyncError` to make UI grouping and retries clearer.  
    Maps to: "SyncErrorStore" and "record the error in SyncErrorStore".

- Add a short `docs/migration.md` checklist for converting a Provider → ProviderShim + Store to keep migrations consistent.  
    Maps to: "Provider shims" and "When you change these rules, update the validator".

- Spell out a security note for IndexedDB persistence: never store raw secret tokens; persist only safe refresh fingerprints or short-lived safe tokens and document the allowed shape.  
    Maps to: "IndexedDB is the authoritative persistence layer".

These are intentionally short, actionable items that avoid restating the existing rules; if you'd like, I can scaffold one or two of them (worker envelope + runtime guard, or Store interface + in-memory adapter) next and wire up a small unit test to demonstrate the pattern.
