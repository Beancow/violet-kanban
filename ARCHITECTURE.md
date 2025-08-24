# Violet Kanban App Architecture

## Overview

This document describes the architecture and requirements for the Violet Kanban application, focusing on maintainability, reliability, and robust offline/online sync.

---

## State management & providers

This project migrated from using Zustand singletons to provider-backed state (React context + reducers + immer). Providers live in `src/providers` and expose hooks for component consumption.

## Persistence

-   Providers centralize persistence and lifecycle logic; localStorage is used where appropriate by the provider reducers.
-   Action queues (board/list/card) are persisted and managed by the queue reducer.

## Integration

-   Define local state via reducers in `src/providers/reducers` and consume them through provider hooks exported from `src/providers`.
-   Use the convenience hooks in `src/providers/useVioletKanbanHooks` for common patterns and enqueue helpers.

## Best practices

-   Use TypeScript for typings and export reducers for unit testing.
-   Keep queue squashing and reconciliation logic in the queue reducer and orchestrator layers.

## Summary

-   State is now managed via providers and reducers; previously-centralized singletons were removed in favor of provider-local instances.

## Store Structure & Maintainability

**Store Example:**
The main Zustand store is implemented in `src/store/appStore.ts`.

-   Uses existing types: `Board`, `BoardList`, `BoardCard` from `src/types/appState.type.ts`.
-   Action type is named `VioletKanbanAction` (based on `SyncAction` from `worker.type.ts`).
-   Local storage key is set to `violet-kanban-storage` for persistence.
-   Store exposes state and split action queues for boards, lists, and cards.

**Store Modularity:** Organize Zustand stores into logical modules (e.g., appStore, syncStore) for clarity and maintainability.
**Custom Hooks:** Use custom hooks to encapsulate store logic and expose only necessary state/actions to components.
**Middleware:** Implement custom middleware for queue management, persistence, and reconciliation logic.
**Documentation:** Document store actions, middleware, and hooks to ensure maintainability and ease of onboarding.
**File Size:** Keep store files concise (ideally under 300 lines); split into multiple files if logic grows too complex.

---

## State & Persistence

**Single Source of Truth:** The Zustand store, persisted via middleware (e.g., `persist`), is the authoritative source for all app data, with localStorage as the underlying persistence layer.
**Automatic Persistence:** Zustand's persistence middleware ensures all boards, lists, cards, and action queues are automatically saved and restored from localStorage.
**Firebase Sync:** Data is pulled from Firebase DB and merged into the Zustand store, which then persists updates to localStorage.
**Action Queues:** Separate queues for boards, lists, and cards are managed in the Zustand store and persisted for reliability and correct sync order.
**Hydration:** On app load, Zustand hydrates state from localStorage, ensuring seamless offline/online transitions.

---

## Queue Management & Sync Logic

**Split Queues:** - Internal queues for boards, lists, and cards are managed and persisted in the Zustand store. - Only the combined `actionQueue` is exposed to consumers; split queues are internal to store logic and middleware.
**Online Sync:** - Store actions and custom middleware process action queues when the browser is online, handling sync with the backend.
**Queue Squashing:** - Multiple actions on the same item are squashed (merged) in store middleware to avoid redundant operations and reduce conflicts.
**Timestamp Check:** - Before processing an action, store logic compares the server’s `updatedAt` with the action’s timestamp.
**Stale Actions:** - If server data is newer, store logic moves the action to a `staleActions` queue for review or conflict resolution.
**Queue Cleanup:** - Successfully processed actions are removed from their respective queues by store actions/middleware.
**Temp ID Handling:** - Queue items use `tempId`; on success, store logic replaces with the real ID in cached data before updating local state, avoiding unnecessary server fetches.

---

## Data Consistency & Conflict Detection

**Server Update Detection:** - After each sync, Zustand store actions and middleware detect if server data has changed and update the local store and cache accordingly.
**Conflict Resolution:** - Store logic and middleware handle conflicts by comparing timestamps and moving stale actions to a review queue, ensuring local and remote data remain consistent.

---

## Service Worker & API Integration

-   **Queue Processing:**
    -   Actions are sent to the service worker, which uses API routes to process them.
-   **API Routes:**
    -   All CRUD operations for boards, lists, and cards must be available as API routes.
-   **Worker-Only API Access:**
    -   API routes are only accessed via the web worker for security and consistency.

---

## Future Considerations

-   Explore real-time sync and multi-user collaboration features using Zustand and service worker integration.

---

_Last updated: 2025-08-20_
