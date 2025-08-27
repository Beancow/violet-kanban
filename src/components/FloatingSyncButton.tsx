'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useVioletKanbanQueues } from '@/providers/useVioletKanbanHooks';
import { ArrowUpIcon } from '@radix-ui/react-icons';
import { ActionQueue } from './ActionQueue';
import { onEvent } from '@/utils/eventBusClient';

export function FloatingSyncButton() {
    const [open, setOpen] = useState(false);
    const { boardActionQueue, listActionQueue, cardActionQueue } =
        useVioletKanbanQueues();
    const actionQueue = [
        ...boardActionQueue,
        ...listActionQueue,
        ...cardActionQueue,
    ];
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const onStart = () => setIsSyncing(true);
        const onStop = () => setIsSyncing(false);
        let offStart: (() => void) | undefined;
        let offStop: (() => void) | undefined;
        try {
            offStart = onEvent('sync:started', () => onStart());
            offStop = onEvent('sync:stopped', () => onStop());
        } catch (e) {
            // fallback to no-op if eventBus isn't available
        }
        return () => {
            try {
                if (typeof offStart === 'function') offStart();
                if (typeof offStop === 'function') offStop();
            } catch (_) {}
        };
    }, []);

    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    zIndex: 1000,
                }}
            >
                <button
                    aria-label='Show sync queue'
                    onClick={() => setOpen(true)}
                    style={{
                        position: 'relative',
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        border: 'none',
                        background: '#2563eb',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <span
                        style={{
                            display: 'inline-block',
                            transformOrigin: 'center',
                            animation: isSyncing
                                ? 'vk-spin 1s linear infinite'
                                : 'none',
                        }}
                    >
                        <ArrowUpIcon />
                    </span>
                    {actionQueue.length > 0 && (
                        <span
                            style={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                fontSize: 12,
                                borderRadius: '50%',
                                padding: '2px 8px',
                                background: 'red',
                                color: 'white',
                                display: 'inline-block',
                            }}
                        >
                            {actionQueue.length}
                        </span>
                    )}
                </button>
            </div>
            {open && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        width: 350,
                        height: '100%',
                        backgroundColor: '#f3f4f6',
                        zIndex: 1001,
                        boxShadow: '-2px 0 5px #0000001a',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'right .3s ease-in-out',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            borderBottom: '1px solid #e5e7eb',
                            backgroundColor: '#e9eef6',
                        }}
                    >
                        <span style={{ fontWeight: 'bold', fontSize: 18 }}>
                            Sync Queue
                        </span>
                        <button
                            onClick={() => setOpen(false)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                fontSize: 18,
                                cursor: 'pointer',
                            }}
                        >
                            ×
                        </button>
                    </div>
                    <div
                        style={{
                            flexGrow: 1,
                            padding: '1rem',
                            overflowY: 'auto',
                        }}
                    >
                        <ActionQueue />
                    </div>
                </div>
            )}
            <style>{`@keyframes vk-spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
        </>
    );
}
