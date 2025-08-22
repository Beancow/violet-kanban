Providers: brief notes

-   Each provider implements a reducer using `immer` to make updates concise and typed.
-   State is persisted to `localStorage` using the same storage keys the Zustand stores used, to ease migration.
-   Providers are self-contained and do not register runtime adapters.
-   This initial scaffold intentionally keeps the API surface minimal. We'll iterate to add missing helpers (enqueue helpers, handle success, reconcile temp ids) next.
