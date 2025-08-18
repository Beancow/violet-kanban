'use client';
import { useState } from 'react';
import { FloatingSyncButton, SyncQueuePanel } from './FloatingSyncButton';

export default function SyncPanelWrapper() {
    const [syncPanelOpen, setSyncPanelOpen] = useState(false);
    return (
        <>
            <FloatingSyncButton />
            <SyncQueuePanel
                open={syncPanelOpen}
                onClose={() => setSyncPanelOpen(false)}
            />
        </>
    );
}
