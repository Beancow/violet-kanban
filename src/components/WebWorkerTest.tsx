import { Button } from '@radix-ui/themes';
import { useAppState } from './AppStateProvider';
import { useWebWorker } from '@/hooks/useWebWorker';
import { User } from '@/types/appState.type';
import { getUser } from '@/lib/firebase/userServerActions';

export function WebWorkerTest() {
    const { user, boards, todos, organizations } = useAppState();

    const { isWorkerReady, workerError, lastPayloadCount, syncData } =
        useWebWorker();

    return (
        <div
            style={{
                padding: '1rem',
                border: '1px solid #ccc',
                borderRadius: '8px',
                margin: '1rem 0',
            }}
        >
            <h3>Web Worker Status</h3>
            <div style={{ marginBottom: '1rem' }}>
                <p>
                    <strong>Status:</strong>{' '}
                    {isWorkerReady ?
                        '✅ Ready'
                    : workerError ?
                        '❌ Error'
                    :   '⏳ Loading...'}
                </p>
                <p>
                    <strong>Current User:</strong>{' '}
                    {user?.name || 'Not logged in'}
                </p>
                {workerError && (
                    <p style={{ color: 'red' }}>
                        <strong>Error:</strong> {workerError}
                    </p>
                )}
                <p>
                    <strong>Data Items:</strong> {lastPayloadCount || 0}
                </p>
                <p>
                    <strong>Current User:</strong>{' '}
                    {user?.name || 'Not logged in'}
                </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button
                    onClick={() =>
                        syncData({
                            type: 'SYNC_TODO_DATA',
                            payload: todos,
                            timestamp: new Date().toISOString(),
                        })
                    }
                    disabled={!isWorkerReady}
                    variant='solid'
                    color='blue'
                >
                    Backup Todo Data
                </Button>

                <Button
                    onClick={() =>
                        syncData({
                            type: 'SYNC_USER_DATA',
                            payload: user as User | null,
                            timestamp: new Date().toISOString(),
                        })
                    }
                    disabled={!isWorkerReady}
                    variant='solid'
                    color='blue'
                >
                    Backup User Data
                </Button>

                <Button
                    onClick={() =>
                        syncData({
                            type: 'SYNC_ORGANIZATION_DATA',
                            payload: organizations,
                            timestamp: new Date().toISOString(),
                        })
                    }
                    disabled={!isWorkerReady}
                    variant='solid'
                    color='blue'
                >
                    Backup Organization Data
                </Button>

                <Button
                    onClick={() =>
                        syncData({
                            type: 'SYNC_BOARD_DATA',
                            payload: boards,
                            timestamp: new Date().toISOString(),
                        })
                    }
                    disabled={!isWorkerReady}
                    variant='solid'
                    color='blue'
                >
                    Sync Board Data
                </Button>

                <Button
                    onClick={() => {
                        if (isWorkerReady) {
                            console.log('Web Worker is ready for operations');
                        } else {
                            console.log('Web Worker is not ready');
                        }
                    }}
                    variant='outline'
                    color='gray'
                >
                    Test Worker
                </Button>
            </div>

            <div
                style={{
                    marginTop: '1rem',
                    fontSize: '0.875rem',
                    color: '#666',
                }}
            >
                <p>This component demonstrates web worker integration:</p>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    <li>Auto-sync every minute</li>
                    <li>Auto-backup every 5 minutes</li>
                    <li>Background processing without blocking UI</li>
                </ul>
            </div>
        </div>
    );
}
