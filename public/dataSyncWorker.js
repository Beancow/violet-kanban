async function handleAddCard(payload) {
    const { boardId, newCard } = payload;
    const response = await fetch('/api/cards/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ boardId, newCard }),
    });

    if (!response.ok) {
        self.postMessage({
            type: 'ERROR',
            payload: { message: 'Failed to add card' },
        });
    }
}

async function handleSoftDeleteCard(payload) {
    const { boardId, cardId } = payload;
    const response = await fetch('/api/cards/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ boardId, cardId }),
    });

    if (!response.ok) {
        self.postMessage({
            type: 'ERROR',
            payload: { message: 'Failed to delete card' },
        });
    }
}

async function handleRestoreCard(payload) {
    const { boardId, cardId } = payload;
    const response = await fetch('/api/cards/restore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ boardId, cardId }),
    });

    if (!response.ok) {
        self.postMessage({
            type: 'ERROR',
            payload: { message: 'Failed to restore card' },
        });
    }
}


    const { data } = payload;
    const response = await fetch('/api/boards/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
    });

    if (!response.ok) {
        self.postMessage({
            type: 'ERROR',
            payload: { message: 'Failed to add board' },
        });
    }
}

async function handleAddList(payload) {
    const { data } = payload;
    const response = await fetch('/api/lists/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
    });

    if (!response.ok) {
        self.postMessage({
            type: 'ERROR',
            payload: { message: 'Failed to add list' },
        });
    }
}

async function handleDeleteList(payload) {
    const { orgId, boardId, listId } = payload;

    // Check if there's a pending deleteBoard action for the same board
    const actionQueue = JSON.parse(localStorage.getItem('actionQueue') || '[]');
    const boardDeletePending = actionQueue.some(
        (action) => action.type === 'deleteBoard' && action.payload.boardId === boardId
    );

    if (boardDeletePending) {
        console.log(`Skipping deleteList for list ${listId} as board ${boardId} is pending deletion.`);
        return; // Do not process this deleteList action
    }

    // Proceed with deleting the list
    const response = await fetch('/api/lists/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orgId, boardId, listId }),
    });

    if (!response.ok) {
        self.postMessage({
            type: 'ERROR',
            payload: { message: 'Failed to delete list' },
        });
        return;
    }

    
}


async function handleDeleteBoard(payload) {
    const { orgId, boardId } = payload;
    const response = await fetch('/api/boards/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orgId, boardId }),
    });

    if (!response.ok) {
        self.postMessage({
            type: 'ERROR',
            payload: { message: 'Failed to delete board' },
        });
    }
}

self.onmessage = async function (e) {
    const { type, payload } = e.data;

    switch (type) {
        case 'addCard':
            await handleAddCard(payload);
            break;
        case 'softDeleteCard':
            await handleSoftDeleteCard(payload);
            break;
        case 'restoreCard':
            await handleRestoreCard(payload);
            break;
        case 'addBoard':
            await handleAddBoard(payload);
            break;
        case 'addList':
            await handleAddList(payload);
            break;
        case 'deleteList':
            await handleDeleteList(payload);
            break;
        case 'deleteBoard':
            await handleDeleteBoard(payload);
            break;
        case 'SYNC_USER_DATA':
            console.log('Worker: Syncing user data...', payload);
            break;
        case 'SYNC_BOARD_DATA':
            console.log('Worker: Syncing board data...', payload);
            break;
        case 'SYNC_TODO_DATA':
            console.log('Worker: Syncing TODO data...', payload);
            break;
        case 'SYNC_ORGANIZATION_DATA':
            console.log('Worker: Syncing organisation data...', payload);
            break;
        default:
            self.postMessage({
                type: 'ERROR',
                payload: { message: `Unknown message type: ${type}` },
            });
    }
};

function handleDataSync(data) {
    try {
        console.log('Worker: Processing data sync...', data);
    } catch (error) {
        self.postMessage({
            type: 'SYNC_ERROR',
            payload: { error: 'Unknown error' },
        });
    }
}

function handleDataBackup(data) {
    try {
        switch (data.type) {
            case 'SYNC_USER_DATA':
                console.log('Worker: Creating user data backup...', data);
                break;
            case 'SYNC_BOARD_DATA':
                console.log('Worker: Creating board data backup...', data);
                break;
            case 'SYNC_TODO_DATA':
                
                break;
            case 'SYNC_ORGANIZATION_DATA':
                
                break;
            default:
                self.postMessage({
                    type: 'ERROR',
                    payload: { message: `Unknown message type: ${data.type}` },
                });
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            payload: { error: 'Backup failed' },
        });
    }
}

function generateChecksum(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}

self.postMessage({
    type: 'WORKER_READY',
    payload: { message: 'Web worker initialized successfully' },
});
