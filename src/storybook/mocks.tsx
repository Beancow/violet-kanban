import React, { useEffect } from 'react';
import OrganizationProvider, {
    useOrganizationProvider,
} from '@/providers/OrganizationProvider';
import { QueueProvider, useQueues } from '@/providers/QueueProvider';

function Seed({ children }: { children: React.ReactNode }) {
    const org = useOrganizationProvider();
    useEffect(() => {
        org.setOrganizations([
            { id: 'org-1', name: 'Acme Co' },
            { id: 'org-2', name: 'Example Inc' },
        ]);
        org.setCurrentOrganizationId('org-1');
    }, []);
    return <>{children}</>;
}

export function useMockOrganization() {
    return useOrganizationProvider();
}

export function useMockQueue() {
    return useQueues();
}

export function MockAppProvider({ children }: { children: React.ReactNode }) {
    return (
        <OrganizationProvider>
            <QueueProvider>
                <Seed>{children}</Seed>
            </QueueProvider>
        </OrganizationProvider>
    );
}
