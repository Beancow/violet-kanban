self.onmessage = function (e) {
    const { type, payload } = e.data;

    switch (type) {
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
                console.log('Worker: Creating TODO data backup...', data);
                break;
            case 'SYNC_ORGANIZATION_DATA':
                console.log(
                    'Worker: Creating organization data backup...',
                    data
                );
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
