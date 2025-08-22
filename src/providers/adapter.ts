// Runtime adapters for non-React code that expects StoreApi access.
// Providers should register their minimal API surface here on mount.

type BoardAdapter = {
    addBoard?: (b: import('../types/appState.type').Board) => void;
    updateBoard?: (
        b: Partial<import('../types/appState.type').Board> & { id: string }
    ) => void;
    removeBoard?: (id: string) => void;
};

let boardAdapter: BoardAdapter | null = null;

export function registerBoardAdapter(adapter: BoardAdapter) {
    boardAdapter = adapter;
}

export function getBoardAdapter(): BoardAdapter | null {
    return boardAdapter;
}

// Similar adapters for list/card/queue can be added as needed.
