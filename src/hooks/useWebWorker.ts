import { useCallback, useEffect, useRef, useState } from 'react';
import { type WorkerMessage } from '@/types/worker.type';

export function useWebWorker() {
    const workerRef = useRef<Worker | null>(null);
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [workerError, setWorkerError] = useState<string | null>(null);
    const [lastPayloadCount, setLastPayloadCount] = useState<number>(0);

    const updatePayloadCount = useCallback((payload: any) => {
        if (Array.isArray(payload)) {
            setLastPayloadCount(payload.length);
        } else if (typeof payload === 'object' && payload !== null) {
            setLastPayloadCount(Object.keys(payload).length);
        } else if (typeof payload === 'string') {
            setLastPayloadCount(1);
        } else {
            setLastPayloadCount(0);
        }
        console.log('Payload count updated:', lastPayloadCount);
    }, []);

    useEffect(() => {
        if (typeof Worker !== 'undefined') {
            try {
                workerRef.current = new window.Worker('./dataSyncWorker.js');

                workerRef.current.onmessage = (
                    e: MessageEvent<WorkerMessage>
                ) => {
                    if (!e || !e.data) {
                        console.warn('Received empty message from worker');
                        return;
                    }

                    const workerMessage = e.data;

                    switch (workerMessage.type) {
                        case 'WORKER_READY':
                            console.log('Web Worker is ready:', workerMessage);
                            setIsWorkerReady(true);
                            setWorkerError(null);
                            updatePayloadCount(null);
                            break;
                        case 'SYNC_USER_DATA':
                            console.log(
                                'Web Worker is ready:',
                                workerMessage.payload
                            );
                            setIsWorkerReady(true);
                            setWorkerError(null);
                            updatePayloadCount(workerMessage.payload);
                            break;
                        case 'SYNC_USER_DATA':
                            console.log(
                                'User data synced:',
                                workerMessage.payload
                            );
                            break;
                        case 'SYNC_CANCEL':
                            console.log(
                                'Sync cancelled:',
                                workerMessage.payload
                            );
                            updatePayloadCount(null);
                            break;
                        case 'SYNC_ERROR':
                            console.error('Sync error:', workerMessage.payload);
                            setWorkerError(workerMessage.payload);
                            updatePayloadCount(null);
                            break;
                        case 'PROCESSING_COMPLETE':
                            console.log(
                                'Processing completed:',
                                workerMessage.payload
                            );
                            updatePayloadCount(workerMessage.payload);
                            setWorkerError(null);
                            break;
                        case 'PROCESSING_ERROR':
                            console.error(
                                'Processing error:',
                                workerMessage.payload
                            );
                            setWorkerError(workerMessage.payload);
                            updatePayloadCount(null);
                            break;
                        case 'SYNC_DATA':
                            console.log('Data synced:', workerMessage.payload);
                            updatePayloadCount(workerMessage.payload);
                            break;
                        case 'SYNC_ORGANIZATION_DATA':
                            console.log(
                                'Organization data synced:',
                                workerMessage.payload
                            );
                            updatePayloadCount(workerMessage.payload);
                            break;
                        case 'SYNC_BOARD_DATA':
                            console.log(
                                'Board data synced:',
                                workerMessage.payload
                            );
                            updatePayloadCount(workerMessage.payload);
                            break;
                        case 'SYNC_TODO_DATA':
                            console.log(
                                'Todo data synced:',
                                workerMessage.payload
                            );
                            updatePayloadCount(workerMessage.payload);
                            break;
                        case 'ERROR':
                            console.error('Worker error:', workerMessage);
                            setWorkerError(workerMessage.error.message);
                            updatePayloadCount(null);
                            break;
                        default:
                            console.log('Unknown worker message:', {
                                ...workerMessage,
                            });
                    }
                };

                workerRef.current.onerror = (error) => {
                    console.error('Web Worker error:', error);
                    setWorkerError('Web Worker encountered an error');
                    setIsWorkerReady(false);
                };
            } catch (error) {
                console.error('Failed to create web worker:', error);
                setWorkerError('Failed to create web worker');
            }
        } else {
            console.warn('Web Workers are not supported in this browser');
            setWorkerError('Web Workers are not supported');
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    const syncData = useCallback(
        (message: WorkerMessage) => {
            if (workerRef.current && isWorkerReady) {
                workerRef.current.postMessage(message);
            } else {
                console.warn('Worker is not ready or not available');
            }
        },
        [isWorkerReady]
    );

    return {
        isWorkerReady,
        workerError,
        lastPayloadCount,
        syncData,
    };
}
