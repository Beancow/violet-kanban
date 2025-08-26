'use client';
import React, { useEffect, useState } from 'react';

export default function DevWorkerDebugPanel() {
    const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'production') return;
        const interval = setInterval(() => {
            try {
                // @ts-ignore
                const w = (window as any).__violet_worker_outgoing || [];
                setLogs(
                    Array.isArray(w) ? w.slice().reverse().slice(0, 50) : []
                );
            } catch (e) {
                setLogs([]);
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    if (process.env.NODE_ENV === 'production') return null;

    return (
        <div
            style={{
                position: 'fixed',
                right: 12,
                bottom: 84,
                zIndex: 9999,
                width: 420,
                maxHeight: '50vh',
                overflow: 'auto',
                background: 'rgba(0,0,0,0.75)',
                color: 'white',
                fontSize: 12,
                padding: 8,
                borderRadius: 6,
            }}
        >
            <div style={{ marginBottom: 6, fontWeight: 'bold' }}>
                Worker Outgoing (dev)
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 6 }}>
                Showing most recent outgoing worker network attempts and their
                result status. This is dev-only and auto-clears.
            </div>
            <div>
                {logs.length === 0 && (
                    <div style={{ opacity: 0.6 }}>no events</div>
                )}
                {logs.map((r, i) => (
                    <div
                        key={i}
                        style={{
                            marginBottom: 6,
                            borderBottom: '1px dashed rgba(255,255,255,0.08)',
                            paddingBottom: 6,
                        }}
                    >
                        <div>
                            <strong>{String(r.type)}</strong>{' '}
                            <span style={{ opacity: 0.7 }}>
                                {new Date(
                                    (r as any).receivedAt || Date.now()
                                ).toLocaleTimeString()}
                            </span>
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.9 }}>
                            {JSON.stringify(r.payload)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
