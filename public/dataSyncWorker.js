async function handleFetchFullData(action) {
    const { orgId, idToken } = action.payload;
    const response = await fetch(`/api/orgs/${orgId}/sync`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
    });

    if (response.ok) {
        const { data } = await response.json();
        self.postMessage({ type: 'FULL_DATA_RECEIVED', payload: data });
    } else {
        self.postMessage({
            type: 'ERROR',
            error: { message: 'Failed to fetch full data' },
        });
    }
}

async function handleCreateBoard(action) {
    const { data, tempId, idToken, orgId } = action.payload;
    const response = await fetch('/api/boards/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
        body: JSON.stringify({ data, tempId }),
    });

    if (response.ok) {
        const { data: responseData } = await response.json(); // { tempId, board }
        self.postMessage({ 
            type: 'ACTION_SUCCESS', 
            payload: { ...responseData, timestamp: action.timestamp } 
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to create board' },
        });
    }
}

async function handleCreateList(action) {
    const { data, boardId, idToken, orgId } = action.payload;
    const tempId = data.id;
    const response = await fetch('/api/lists/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
        body: JSON.stringify({ data, boardId, tempId }),
    });

    if (response.ok) {
        const { data: responseData } = await response.json(); // { tempId, list }
        self.postMessage({ 
            type: 'ACTION_SUCCESS', 
            payload: { ...responseData, timestamp: action.timestamp } 
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to add list' },
        });
    }
}

async function handleCreateCard(action) {
    const { data, boardId, listId, idToken, orgId } = action.payload;
    const tempId = data.id;
    const response = await fetch('/api/cards/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
        body: JSON.stringify({ data, boardId, listId, tempId }),
    });

    if (response.ok) {
        const { data: responseData } = await response.json(); // { tempId, card }
        self.postMessage({ 
            type: 'ACTION_SUCCESS', 
            payload: { ...responseData, timestamp: action.timestamp } 
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to create card' },
        });
    }
}

async function handleUpdateCard(action) {
    const { boardId, cardId, data, idToken, orgId } = action.payload;
    const response = await fetch('/api/cards/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
        body: JSON.stringify({ boardId, cardId, data }),
    });

    if (response.ok) {
        self.postMessage({ type: 'ACTION_SUCCESS', payload: { timestamp: action.timestamp } });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to update card' },
        });
    }
}

async function handleDeleteCard(action) {
    const { boardId, cardId, idToken, orgId } = action.payload;
    const response = await fetch('/api/cards/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
        body: JSON.stringify({ boardId, cardId }),
    });

    if (response.ok) {
        self.postMessage({ type: 'ACTION_SUCCESS', payload: { timestamp: action.timestamp } });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to delete card' },
        });
    }
}

async function handleSoftDeleteCard(action) {
    const { boardId, cardId, idToken, orgId } = action.payload;
    const response = await fetch('/api/cards/soft-delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
        body: JSON.stringify({ boardId, cardId }),
    });

    if (response.ok) {
        self.postMessage({ type: 'ACTION_SUCCESS', payload: { timestamp: action.timestamp } });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to soft delete card' },
        });
    }
}

async function handleRestoreCard(action) {
    const { boardId, cardId, idToken, orgId } = action.payload;
    const response = await fetch('/api/cards/restore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
        body: JSON.stringify({ boardId, cardId }),
    });

    if (response.ok) {
        self.postMessage({ type: 'ACTION_SUCCESS', payload: { timestamp: action.timestamp } });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to restore card' },
        });
    }
}

async function handleDeleteList(action) {
    const { boardId, listId, idToken, orgId } = action.payload;
    const response = await fetch('/api/lists/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
        body: JSON.stringify({ boardId, listId }),
    });

    if (response.ok) {
        self.postMessage({ type: 'ACTION_SUCCESS', payload: { timestamp: action.timestamp } });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to delete list' },
        });
    }
}

async function handleUpdateBoard(action) {
    const { boardId, data, idToken, orgId } = action.payload;
    const response = await fetch('/api/boards/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
        body: JSON.stringify({ boardId, data }),
    });

    if (response.ok) {
        self.postMessage({ type: 'ACTION_SUCCESS', payload: { timestamp: action.timestamp } });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to update board' },
        });
    }
}

async function handleDeleteBoard(action) {
    const { boardId, idToken, orgId } = action.payload;
    const response = await fetch('/api/boards/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
        body: JSON.stringify({ boardId }),
    });

    if (response.ok) {
        self.postMessage({ type: 'ACTION_SUCCESS', payload: { timestamp: action.timestamp } });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to delete board' },
        });
    }
}

// ... (All other handlers will be similarly modified to post back to the main thread)

self.onmessage = async function (e) {
    const action = e.data;

    try {
        switch (action.type) {
            case 'FETCH_FULL_DATA':
                await handleFetchFullData(action);
                break;
            case 'create-board':
                await handleCreateBoard(action);
                break;
            case 'update-board':
                await handleUpdateBoard(action);
                break;
            case 'delete-board':
                await handleDeleteBoard(action);
                break;
            case 'create-list':
                await handleCreateList(action);
                break;
            case 'delete-list':
                await handleDeleteList(action);
                break;
            case 'create-card':
                await handleCreateCard(action);
                break;
            case 'update-card':
                await handleUpdateCard(action);
                break;
            case 'delete-card':
            await handleDeleteCard(action);
            break;
        case 'soft-delete-card':
            await handleSoftDeleteCard(action);
            break;
        case 'restore-card':
            await handleRestoreCard(action);
            break;
            default:
                self.postMessage({
                    type: 'ERROR',
                    payload: { timestamp: action.timestamp },
                    error: { message: `Unknown message type: ${action.type}` },
                });
        }
    } catch (error) {
        console.error(`Worker error processing action ${action.type}:`, error);
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: error.message || 'An unknown error occurred in the worker' },
        });
    }
};

self.postMessage({ type: 'WORKER_READY' });