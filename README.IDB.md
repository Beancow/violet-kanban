This README documents the new IndexedDB-backed stores and provider scaffolding added for offline-first sync.

Files added

-   `src/utils/idbWrapper.ts` — tiny promise-based IndexedDB wrapper (no external deps).
-   `src/stores/BoardStore.ts` — Board store using IDBWrapper; exposes getAll/get/put/delete/clearForOrg.
-   `src/hooks/useBroadcastChannel.ts` — BroadcastChannel wrapper with `storage` fallback.
-   `src/providers/BoardIDBProvider.tsx` — New Board provider backed by IDB and server fetch. Exposes similar API to the original `BoardProvider`.

Design notes

-   Providers remain canonical state for UI, backed by IndexedDB.
-   BoardIDBProvider will attempt to fetch `/api/boards` on `currentOrganizationId` change and write to IDB, falling back to IDB if network fails.
-   BroadcastChannel is used to notify other tabs about `boards:updated` so they can refresh from IDB.
-   The pattern can be repeated for `ListStore` and `CardStore` and their providers.

How to use

-   Replace `BoardProvider` in `AppProvider.tsx` with `BoardIDBProvider` to enable the IDB-backed behaviour.
-   To add offline background sync and reliable retry, scaffold a Service Worker that consumes `vk:queue` items and posts them to the server.

Next steps

-   Implement `ListStore`/`CardStore` and `ListIDBProvider`/`CardIDBProvider` following the `Board` pattern.
-   Implement queue storage in IDB and background sync (Service Worker + Background Sync API). A fallback SyncManager in the page is useful when SW unsupported.
-   Add conflict resolution: per-record `rev`/`updatedAt`, idempotency keys, and merge strategies.
-   Add `fake-indexeddb` for Jest tests and update tests to use the new providers.
