# Legacy `src/store` (Frozen)

This folder contains the legacy Zustand-based runtime stores. During the migration to React providers (
`src/providers/*`) these files are intentionally left in-place as a read-only compatibility layer.

Policy:

-   These files are frozen and should not be modified directly. Pull requests that modify files under `src/store/` will fail CI.
-   If you need to change behavior, implement the change in `src/providers` and update consumers to use the providers instead.
-   To request an exception, open an issue titled `store change request` and tag the migration owners.

When the migration is complete `src/store` will be removed. Before that happens we will:

1. Ensure all types and interfaces needed by the app are moved to `src/types/`.
2. Replace all runtime `@/store/*` imports in components with provider equivalents.
3. Remove the `src/store` folder and delete the CI gating workflow.
