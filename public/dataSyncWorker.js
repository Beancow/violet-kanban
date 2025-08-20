async function handleCreateOrganization(action) {
    const { payload, timestamp } = action;
    const { idToken, ...orgData } = payload;
    const headers = {
        'Content-Type': 'application/json',
    };
    if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
    }
    const response = await fetch('/api/orgs/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(orgData),
    });
    if (response.ok) {
        const result = await response.json();
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: { timestamp, type: action.type, ...result.data },
        });
    } else {
        const error = await response.json();
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp, type: action.type },
            error: { message: error?.error || 'Failed to create organization' },
        });
    }
}
async function handleFetchOrgData(action) {
    const { organizationId, idToken } = action.payload;
    const response = await fetch(`/api/orgs/${organizationId}/sync`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            'X-Organization-Id': organizationId,
        },
    });
    if (response.ok) {
        const { data } = await response.json();
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: {
                ...data,
                timestamp: action.timestamp,
                type: action.type,
            },
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp, type: action.type },
            error: { message: 'Failed to fetch org data' },
        });
    }
}

async function handleCreateBoard(action) {
    const { data, tempId, idToken } = action.payload;
    const response = await fetch('/api/boards/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ data, tempId }),
    });
    if (response.ok) {
        const { data: responseData } = await response.json();
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: {
                ...responseData,
                timestamp: action.timestamp,
                type: action.type,
            },
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp, type: action.type },
            error: { message: 'Failed to create board' },
        });
    }
}

async function handleCreateList(action) {
    const { data, boardId, tempId, idToken } = action.payload;
    const response = await fetch('/api/lists/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ data, boardId, tempId }),
    });
    if (response.ok) {
        const { data: responseData } = await response.json();
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: {
                ...responseData,
                timestamp: action.timestamp,
                type: action.type,
            },
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp, type: action.type },
            error: { message: 'Failed to add list' },
        });
    }
}

async function handleCreateCard(action) {
    const { data, boardId, listId, tempId, idToken } = action.payload;
    const response = await fetch('/api/cards/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ data, boardId, listId, tempId }),
    });
    if (response.ok) {
        const { data: responseData } = await response.json();
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: {
                ...responseData,
                timestamp: action.timestamp,
                type: action.type,
            },
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp, type: action.type },
            error: { message: 'Failed to create card' },
        });
    }
}

async function handleUpdateCard(action) {
    const { data, idToken } = action.payload;
    const response = await fetch('/api/cards/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ data }),
    });
    if (response.ok) {
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: { timestamp: action.timestamp },
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to update card' },
        });
    }
}

async function handleDeleteCard(action) {
    const { id, idToken } = action.payload;
    const response = await fetch('/api/cards/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id }),
    });
    if (response.ok) {
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: { timestamp: action.timestamp },
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to delete card' },
        });
    }
}

async function handleSoftDeleteCard(action) {
    const { id, idToken } = action.payload;
    const response = await fetch('/api/cards/soft-delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id }),
    });
    if (response.ok) {
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: { timestamp: action.timestamp },
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to soft delete card' },
        });
    }
}

async function handleRestoreCard(action) {
    const { id, idToken } = action.payload;
    const response = await fetch('/api/cards/restore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id }),
    });
    if (response.ok) {
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: { timestamp: action.timestamp },
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to restore card' },
        });
    }
}

async function handleDeleteList(action) {
    const { id, idToken } = action.payload;
    const response = await fetch('/api/lists/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id }),
    });
    if (response.ok) {
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: { timestamp: action.timestamp },
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to delete list' },
        });
    }
}

async function handleUpdateBoard(action) {
    const { data, idToken } = action.payload;
    const response = await fetch('/api/boards/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ data }),
    });
    if (response.ok) {
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: { timestamp: action.timestamp },
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to update board' },
        });
    }
}

async function handleDeleteBoard(action) {
    const { id, idToken } = action.payload;
    const response = await fetch('/api/boards/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id }),
    });
    if (response.ok) {
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: { timestamp: action.timestamp },
        });
    } else {
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp },
            error: { message: 'Failed to delete board' },
        });
    }
}

// Worker versioning
const WORKER_VERSION = '1.0.0';

self.onmessage = async function (e) {
    // Check for version request
    if (e.data && e.data.type === 'GET_WORKER_VERSION') {
        console.log('🤖 [Worker] Received GET_WORKER_VERSION');
        self.postMessage({ type: 'WORKER_VERSION', version: WORKER_VERSION });
        return;
    }
    const action = e.data;
    try {
        console.log(
            `🟣🤖 [Worker] Received action: ${action.type} @ ${action.timestamp}`
        );
        switch (action.type) {
            case 'create-board':
                console.log(
                    `🟦 [Worker] Creating board @ ${action.timestamp}`,
                    action
                );
                await handleCreateBoard(action);
                break;
            case 'update-board':
                console.log(
                    `🟦 [Worker] Updating board @ ${action.timestamp}`,
                    action
                );
                await handleUpdateBoard(action);
                break;
            case 'delete-board':
                console.log(
                    `🟦 [Worker] Deleting board @ ${action.timestamp}`,
                    action
                );
                await handleDeleteBoard(action);
                break;
            case 'create-list':
                console.log(
                    `🟩 [Worker] Creating list @ ${action.timestamp}`,
                    action
                );
                await handleCreateList(action);
                break;
            case 'update-list':
                console.log(
                    `🟩 [Worker] Updating list @ ${action.timestamp}`,
                    action
                );
                // Implement as needed
                break;
            case 'delete-list':
                console.log(
                    `🟩 [Worker] Deleting list @ ${action.timestamp}`,
                    action
                );
                await handleDeleteList(action);
                break;
            case 'create-card':
                console.log(
                    `🟨 [Worker] Creating card @ ${action.timestamp}`,
                    action
                );
                await handleCreateCard(action);
                break;
            case 'update-card':
                console.log(
                    `🟨 [Worker] Updating card @ ${action.timestamp}`,
                    action
                );
                await handleUpdateCard(action);
                break;
            case 'delete-card':
                console.log(
                    `🟨 [Worker] Deleting card @ ${action.timestamp}`,
                    action
                );
                await handleDeleteCard(action);
                break;
            case 'soft-delete-card':
                console.log(
                    `🟨 [Worker] Soft-deleting card @ ${action.timestamp}`,
                    action
                );
                await handleSoftDeleteCard(action);
                break;
            case 'restore-card':
                console.log(
                    `🟨 [Worker] Restoring card @ ${action.timestamp}`,
                    action
                );
                await handleRestoreCard(action);
                break;
            case 'move-board':
                console.log(
                    `🟦 [Worker] Moving board @ ${action.timestamp}`,
                    action
                );
                // Implement as needed
                break;
            case 'move-list':
                console.log(
                    `🟩 [Worker] Moving list @ ${action.timestamp}`,
                    action
                );
                // Implement as needed
                break;
            case 'move-card':
                console.log(
                    `🟨 [Worker] Moving card @ ${action.timestamp}`,
                    action
                );
                // Implement as needed
                break;
            case 'create-organization':
                console.log(
                    `🟪 [Worker] Creating organization @ ${action.timestamp}`,
                    action
                );
                await handleCreateOrganization(action);
                break;
            case 'update-organization':
                console.log(
                    `🟪 [Worker] Updating organization @ ${action.timestamp}`,
                    action
                );
                // Implement as needed
                break;
            case 'delete-organization':
                console.log(
                    `🟪 [Worker] Deleting organization @ ${action.timestamp}`,
                    action
                );
                // Implement as needed
                break;
            case 'fetch-org-data':
                console.log(
                    `🟪 [Worker] Fetching org data @ ${action.timestamp}`,
                    action
                );
                await handleFetchOrgData(action);
                break;
            case 'sync-complete':
                console.log(
                    `🟣 [Worker] Sync complete @ ${action.timestamp}`,
                    action
                );
                // Implement as needed
                break;
            case 'error':
                console.log(
                    `🔴 [Worker] Error action received @ ${action.timestamp}`,
                    action
                );
                // Implement as needed
                break;
            default:
                console.error(
                    `🔴🤖 [Worker] Unknown message type: ${action.type} @ ${action.timestamp}`,
                    action
                );
                self.postMessage({
                    type: 'ERROR',
                    payload: { timestamp: action.timestamp, type: action.type },
                    error: { message: `Unknown message type: ${action.type}` },
                });
        }
    } catch (error) {
        console.error(
            `🔴🤖 [Worker] Error in action handler @ ${action.timestamp}:`,
            error
        );
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action.timestamp, type: action.type },
            error: {
                message:
                    error.message || 'An unknown error occurred in the worker',
            },
        });
    }
};

self.postMessage({ type: 'WORKER_READY', version: WORKER_VERSION });
