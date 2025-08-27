// Simple BroadcastChannel wrapper with local fallback to storage events.
import { useEffect, useRef } from 'react';

export function useBroadcastChannel(
    channelName: string,
    onMessage: (m: any) => void
) {
    const bcRef = useRef<BroadcastChannel | null>(null);

    useEffect(() => {
        let stopped = false;
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                const bc = new BroadcastChannel(channelName);
                bcRef.current = bc;
                bc.onmessage = (e) => {
                    try {
                        onMessage(e.data);
                    } catch (_) {}
                };
            } catch (e) {
                // fallback to storage events
                const handler = (ev: StorageEvent) => {
                    try {
                        if (ev.key === channelName && ev.newValue) {
                            const data = JSON.parse(ev.newValue);
                            onMessage(data);
                        }
                    } catch (_) {}
                };
                window.addEventListener('storage', handler);
                return () => window.removeEventListener('storage', handler);
            }
        } else {
            const handler = (ev: StorageEvent) => {
                try {
                    if (ev.key === channelName && ev.newValue) {
                        const data = JSON.parse(ev.newValue);
                        onMessage(data);
                    }
                } catch (_) {}
            };
            window.addEventListener('storage', handler);
            return () => window.removeEventListener('storage', handler);
        }
        return () => {
            try {
                bcRef.current?.close();
            } catch (_) {}
            stopped = true;
        };
    }, [channelName, onMessage]);

    const post = (msg: any) => {
        try {
            if (bcRef.current) bcRef.current.postMessage(msg);
            else window.localStorage.setItem(channelName, JSON.stringify(msg));
        } catch (e) {
            /* ignore */
        }
    };

    return { post };
}

export default useBroadcastChannel;
