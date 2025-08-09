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

async function handleAddBoard(action) {
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
            error: { message: 'Failed to add board' },
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
            await handleAddBoard(action);
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