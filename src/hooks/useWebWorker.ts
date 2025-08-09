
import { useCallback, useEffect, useRef, useState } from 'react';
import { type WorkerMessage } from '@/types/worker.type';

export function useWebWorker() {
    const workerRef = useRef<Worker | null>(null);
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [workerError, setWorkerError] = useState<string | null>(null);
    const [lastMessage, setLastMessage] = useState<WorkerMessage | null>(null);

    useEffect(() => {
        console.log('Setting up web worker...');
        if (typeof Worker !== 'undefined') {
            try {
                workerRef.current = new window.Worker('/dataSyncWorker.js');

                workerRef.current.onmessage = (
                    e: MessageEvent<WorkerMessage>
                ) => {
                    if (!e || !e.data) {
                        console.warn('Received empty or invalid message from worker');
                        return;
                    }
                    console.log('Received message from worker:', e.data); // Log every message
                    setLastMessage(e.data);

                    // Explicitly check for WORKER_READY here
                    if (e.data.type === 'WORKER_READY') {
                        console.log('WORKER IS READY, setting state.');
                        setIsWorkerReady(true);
                    }
                };

                workerRef.current.onerror = (error) => {
                    console.error('Web Worker error:', error);
                    setWorkerError('Web Worker encountered an error');
                    setIsWorkerReady(false);
                };
            } catch (err) {
                console.error('Failed to create web worker:', err);
                setWorkerError('Failed to create web worker');
            }
        } else {
            console.warn('Web Workers are not supported in this environment.');
            setWorkerError('Web Workers are not supported');
        }

        return () => {
            if (workerRef.current) {
                console.log('Terminating web worker.');
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    const postMessage = useCallback(
        (message: WorkerMessage) => {
            if (workerRef.current) {
                console.log('Posting message to worker:', message);
                workerRef.current.postMessage(message);
            } else {
                console.error('Could not post message: Worker is not available.');
            }
        },
        []
    );

    return {
        isWorkerReady,
        workerError,
        lastMessage,
        postMessage,
    };
}
