import { useCallback, useEffect, useRef, useState } from 'react';
import { type WorkerMessage } from '@/types/worker.type';
export function useWebWorker() {
    const workerRef = useRef<Worker | null>(null);
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [workerError, setWorkerError] = useState<string | null>(null);
    const [lastMessage, setLastMessage] = useState<WorkerMessage | null>(null);
    const [workerVersion, setWorkerVersion] = useState<string | null>(null);
    const EXPECTED_WORKER_VERSION = '1.0.0';

    useEffect(() => {
        if (typeof Worker !== 'undefined') {
            try {
                const createWorker = () => {
                    const newWorker = new window.Worker('/dataSyncWorker.js');
                    newWorker.onmessage = (
                        e: MessageEvent<
                            WorkerMessage | { type: string; version?: string }
                        >
                    ) => {
                        if (!e || !e.data) {
                            return;
                        }
                        setLastMessage(e.data as WorkerMessage);

                        if (e.data.type === 'WORKER_READY') {
                            setIsWorkerReady(true);
                            if (
                                'version' in e.data &&
                                typeof e.data.version === 'string'
                            ) {
                                setWorkerVersion(e.data.version);
                                if (
                                    e.data.version !== EXPECTED_WORKER_VERSION
                                ) {
                                    setIsWorkerReady(false);
                                    newWorker.terminate();
                                    workerRef.current = createWorker();
                                    workerRef.current.postMessage({
                                        type: 'GET_WORKER_VERSION',
                                    });
                                }
                            }
                        }
                        if (e.data.type === 'WORKER_VERSION') {
                            setWorkerVersion(e.data.version || null);
                            if (e.data.version !== EXPECTED_WORKER_VERSION) {
                                setIsWorkerReady(false);
                                newWorker.terminate();
                                workerRef.current = createWorker();
                                workerRef.current.postMessage({
                                    type: 'GET_WORKER_VERSION',
                                });
                            }
                        }
                    };
                    newWorker.onerror = (error) => {
                        setWorkerError('Web Worker encountered an error');
                        setIsWorkerReady(false);
                    };
                    // Request worker version on init
                    newWorker.postMessage({ type: 'GET_WORKER_VERSION' });
                    return newWorker;
                };
                workerRef.current = createWorker();
            } catch (err) {
                setWorkerError('Failed to create web worker');
            }
        } else {
            setWorkerError('Web Workers are not supported');
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    const postMessage = useCallback((message: WorkerMessage) => {
        if (workerRef.current) {
            workerRef.current.postMessage(message);
        }
    }, []);

    return {
        isWorkerReady,
        workerError,
        lastMessage,
        postMessage,
        workerVersion,
    };
}
