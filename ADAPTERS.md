Runtime adapters (migration bridge)

Purpose

- Provide a tiny, strictly-typed compatibility layer so existing non-React code (or code that expects a Zustand StoreApi) can continue to work while providers and reducers are introduced incrementally.
- Keep the adapter surface minimal: expose only the functions callers need (for example: addBoard, updateBoard, removeBoard). This avoids leaking broad store internals and makes removal straightforward.

Design and types (recommended)

- Each adapter is a small object with a few named methods. Example TypeScript interfaces:

  - BoardAdapter
    - addBoard(b: Board): void
    - updateBoard(b: Partial<Board> & { id: string }): void
    - removeBoard(id: string): void

  - ListAdapter
    - addList(l: BoardList): void
    - updateList(l: Partial<BoardList> & { id: string }): void
    - removeList(id: string): void

  - CardAdapter
    - addCard(c: BoardCard): void
    - updateCard(c: Partial<BoardCard> & { id: string }): void
    - removeCard(id: string): void

  - QueueAdapter (optional, keep tiny)
    - enqueueCardAction(a: VioletKanbanAction): void
    - removeCardAction(tempOrId: string): void

  - TempIdMapAdapter
    - setMapping(tempId: string, realId: string): void
    - getRealId(tempId: string): string | undefined
    - clearMapping(tempId: string): void

Registration pattern

- Providers register their runtime adapter when they mount on the client. Example (pseudo):

  BoardProvider mount:
  - registerBoardAdapter({ addBoard, updateBoard, removeBoard })
  - on unmount: registerBoardAdapter(null)

- Consumers must always check for the adapter being present and handle the null case (either throw an informative error or choose a safe fallback). Example:

  const boardAdapter = getBoardAdapter();
  if (!boardAdapter) throw new Error('Board adapter not registered - ensure AppProvider is mounted');
  boardAdapter.addBoard(board);

Usage notes

- Keep adapters synchronous and side-effect-free beyond calling into providers' dispatch functions.
- Do not expose a full StoreApi; avoid getState/setState getters that encourage wide coupling.
- Prefer `void`-returning methods that call provider dispatchers or typed helpers.

Testing

- Tests should inject lightweight adapters to avoid mounting full providers. For unit tests provide a fake adapter object with expected methods.
- For integration tests, mount the provider tree and rely on provider registration instead of fakes.

Removal plan (when migration is complete)

1. Ensure no runtime or server-side code imports any `get*Adapter()` or `register*Adapter()` helpers.
2. Replace any test fakes with provider-backed test setup where appropriate.
3. Delete the adapter module(s) and update imports.
4. Remove legacy Zustand store files and the `zustand` dependency in package.json.
5. Run full typecheck and test suite.

Migration checklist (short)

- [ ] Add adapters for all stores still used from non-React code (board/list/card/queue/tempIdMap)
- [ ] Migrate callers to provider hooks where practical
- [ ] Convert remaining non-React callers to use provider adapters or orchestrator API
- [ ] Remove adapters and legacy Zustand stores

Rationale

The adapter keeps the migration incremental and low-risk. By constraining its API surface and giving a clear removal plan we can avoid long-lived technical debt.
