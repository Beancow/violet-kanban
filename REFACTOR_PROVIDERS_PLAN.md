Refactor plan: Replace Zustand stores with React providers using immer + reducers

Goals

-   Replace Zustand stores with React Context + useReducer using immer for immutability.
-   Keep state persistence (localStorage) per provider; optionally migrate to IndexedDB later for large payloads.
-   Preserve queueing behavior and temp-id reconciliation used for offline writes.
-   Avoid any/unsafe casts; keep TypeScript types clean and adjust types first if needed.
-   Make reducers pure and export them for unit testing.

Checklist

-   [ ] Create a dedicated branch: refactor/providers-reducers
-   [ ] Create provider modules: AppProvider, BoardProvider, ListProvider, CardProvider, QueueProvider, TempIdMapProvider
-   [ ] Extract reducers to src/providers/reducers/\*.ts files and export for tests
-   [ ] Port helper functions (getActionItemId, squashQueueActions, reconcileTempId) into provider area
-   [ ] Implement localStorage-based persistence helpers and storage keys per provider
-   [ ] Write unit tests for reducers (happy path + 1-2 edge cases per reducer)
-   [ ] Remove adapter runtime bridge (no longer needed)
-   [ ] Add integration test mounting AppProvider and exercising hooks
-   [ ] Run tsc --noEmit and jest test suites; fix type issues
-   [ ] Prepare a migration guide and delete old Zustand stores after consumers are migrated

Risks and mitigations

-   Type mismatches across app: run tsc early and fix types or add incremental type changes as separate PRs.
-   Large data persistence: localStorage might be insufficient; plan IndexedDB migration if needed.
-   Concurrent updates and out-of-order reconciliations: keep existing squash and stale-check logic ported from Zustand stores.

Next steps

1. Implement provider/reducer scaffolding and reducers under src/providers/reducers
2. Add unit tests for reducers and run test suite
3. Remove adapter and validate tests
4. Add AppProvider integration test
5. Open PR and migrate consumers piecewise; delete old stores after migration

Branch: refactor/providers-reducers
