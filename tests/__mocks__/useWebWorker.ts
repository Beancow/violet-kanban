import React from 'react';

// Small test mock for the useWebWorker hook. Tests can call __setLastMessage
// to simulate incoming worker messages; the hook uses React state so
// components receive updates via re-render.

export type WorkerMessage = any;

let lastMessageHolder: WorkerMessage | null = null;
let setLastMessageFn: ((m: WorkerMessage | null) => void) | null = null;

export function __setLastMessage(m: WorkerMessage | null) {
    if (setLastMessageFn) setLastMessageFn(m);
    else lastMessageHolder = m;
}

export function __resetMock() {
    lastMessageHolder = null;
}

const postMessageMock = jest.fn();

export function useWebWorker() {
    const [lastMessage, setLastMessage] = React.useState<WorkerMessage | null>(
        lastMessageHolder
    );
    React.useEffect(() => {
        setLastMessageFn = setLastMessage;
        return () => {
            setLastMessageFn = null;
        };
    }, []);

    return {
        postMessage: postMessageMock,
        lastMessage,
        isWorkerReady: true,
        workerVersion: 'test-fake',
    } as const;
}

export const __postMessageMock = postMessageMock;
