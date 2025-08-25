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

export function GlobalSeed({
    seedQueue = false,
    children,
}: {
    seedQueue?: boolean;
    children?: React.ReactNode;
}) {
    const org = useOrganizationProvider();
    const addBoard =
        require('@/providers/useVioletKanbanHooks').useVioletKanbanAddBoard();
    const addList =
        require('@/providers/useVioletKanbanHooks').useVioletKanbanAddList();
    const addCard =
        require('@/providers/useVioletKanbanHooks').useVioletKanbanAddCard();
    const q = useQueues();

    useEffect(() => {
        org.setOrganizations([
            { id: 'org-1', name: 'Acme Co' },
            { id: 'org-2', name: 'Example Inc' },
        ]);
        org.setCurrentOrganizationId('org-1');

        // Seed boards, lists, and cards
        try {
            addBoard({
                id: 'b-1',
                title: 'Backlog',
                organizationId: 'org-1',
            } as any);
            addBoard({
                id: 'b-2',
                title: 'In Progress',
                organizationId: 'org-1',
            } as any);

            addList({
                id: 'l-1',
                title: 'Todo',
                boardId: 'b-1',
                position: 0,
                organizationId: 'org-1',
            } as any);
            addList({
                id: 'l-2',
                title: 'Doing',
                boardId: 'b-2',
                position: 0,
                organizationId: 'org-1',
            } as any);

            addCard({
                id: 'c-1',
                title: 'Write tests',
                boardId: 'b-1',
                listId: 'l-1',
                position: 0,
                organizationId: 'org-1',
            } as any);
            addCard({
                id: 'c-2',
                title: 'Implement provider',
                boardId: 'b-1',
                listId: 'l-1',
                position: 1,
                organizationId: 'org-1',
            } as any);
        } catch (e) {
            // swallow if hooks not available yet
        }

        if (seedQueue) {
            q.enqueueBoardAction({
                type: 'create-board',
                payload: {
                    tempId: 'g-temp-1',
                    data: { title: 'G Board', organizationId: 'org-1' },
                } as any,
            } as any);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
