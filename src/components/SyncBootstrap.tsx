'use client';
import React, { useEffect, useRef } from 'react';
import SyncOrchestrator from '@/services/SyncOrchestrator';
import { useQueues } from '@/providers/QueueProvider';
import { useSyncErrorProvider } from '@/providers/SyncErrorProvider';
import { useOrganizationProvider } from '@/providers/OrganizationProvider';
import { useWebWorker } from '@/hooks/useWebWorker';
import useFreshToken from '@/hooks/useFreshToken';
import { useReconciliation } from '@/providers/ReconciliationProvider';
import { useTempIdMap } from '@/providers/TempIdMapProvider';

export default function SyncBootstrap() {
    const queueApi = useQueues();
    const syncError = useSyncErrorProvider();
    const org = useOrganizationProvider();
    const { postMessage, lastMessage } = useWebWorker();
    const getFreshToken = useFreshToken();
    const reconciliation = useReconciliation();
    const tempMap = useTempIdMap();

    const orchestratorRef = useRef<SyncOrchestrator | null>(null);

    useEffect(() => {
        const orchestrator = new SyncOrchestrator({
            queueApi,
            syncError,
            getFreshToken,
            postMessage,
            reconciliation,
            tempMap,
            orgProvider: {
                currentOrganizationId: org.currentOrganizationId ?? undefined,
            },
        });
        orchestratorRef.current = orchestrator;
        orchestrator.start();

        return () => {
            try {
                orchestrator.stop();
            } catch (_) {}
            orchestratorRef.current = null;
        };
    }, [
        queueApi,
        syncError,
        getFreshToken,
        postMessage,
        reconciliation,
        tempMap,
    ]);

    useEffect(() => {
        if (lastMessage && orchestratorRef.current)
            orchestratorRef.current.handleWorkerMessage(lastMessage);
    }, [lastMessage]);

    return null;
}
