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
        const { data: responseData } = await response.json();
        self.postMessage({ type: 'RECONCILE_BOARD_ID', payload: responseData });
        self.postMessage({ type: 'ACTION_SUCCESS', payload: { timestamp: action.timestamp } });
    } else {
        self.postMessage({
            type: 'ERROR',
            error: { message: 'Failed to create board' },
        });
    }
}

async function handleCreateList(action) {
    const { data, idToken, orgId } = action.payload;
    const tempId = data.id; // The tempId is the ID of the list data
    const response = await fetch('/api/lists/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Organization-Id': orgId,
        },
        body: JSON.stringify({ data, tempId }),
    });

    if (response.ok) {
        const { data: responseData } = await response.json();
        self.postMessage({ type: 'RECONCILE_LIST_ID', payload: responseData });
        self.postMessage({ type: 'ACTION_SUCCESS', payload: { timestamp: action.timestamp } });
    } else {
        self.postMessage({
            type: 'ERROR',
            error: { message: 'Failed to add list' },
        });
    }
}

// ... (All other handlers will be similarly modified to post back to the main thread)

self.onmessage = async function (e) {
    const action = e.data;

    switch (action.type) {
        case 'FETCH_FULL_DATA':
            await handleFetchFullData(action);
            break;
        case 'create-board':
            await handleCreateBoard(action);
            break;
        case 'create-list':
            await handleCreateList(action);
            break;
        // ... other cases
        default:
            self.postMessage({
                type: 'ERROR',
                error: { message: `Unknown message type: ${action.type}` },
            });
    }
};

self.postMessage({ type: 'WORKER_READY' });