import React, { createContext, useContext, useState } from 'react';

const OrgContext = createContext<any>(null);
const QueueContext = createContext<any>(null);

export function MockOrganizationProvider({ children }: { children: React.ReactNode }) {
    const [organizations] = useState([
        { id: 'org-1', name: 'Acme Co' },
        { id: 'org-2', name: 'Example Inc' },
    ]);
    const api = {
        organizations,
        loading: false,
        currentOrganizationId: organizations[0].id,
        currentOrganization: organizations[0],
        setCurrentOrganizationId: (_: string | null) => undefined,
        setOrganizations: (_: any) => undefined,
        setLoading: (_: boolean) => undefined,
        refetchOrganizations: async () => {},
    };
    return <OrgContext.Provider value={api}>{children}</OrgContext.Provider>;
}

type MockQueueState = {
    boardActionQueue: any[];
    listActionQueue: any[];
    cardActionQueue: any[];
};

export function MockQueueProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<MockQueueState>({
        boardActionQueue: [],
        listActionQueue: [],
        cardActionQueue: [],
    });
    const api = {
        state,
        enqueueBoardAction: (a: any) => setState((s) => ({ ...s, boardActionQueue: [...s.boardActionQueue, a] })),
        enqueueListAction: (a: any) => setState((s) => ({ ...s, listActionQueue: [...s.listActionQueue, a] })),
        enqueueCardAction: (a: any) => setState((s) => ({ ...s, cardActionQueue: [...s.cardActionQueue, a] })),
        removeBoardAction: (id: string) => setState((s) => ({ ...s, boardActionQueue: s.boardActionQueue.filter((x: any) => x.payload?.tempId !== id && x.payload?.id !== id) })),
        removeListAction: (id: string) => setState((s) => ({ ...s, listActionQueue: s.listActionQueue.filter((x: any) => x.payload?.tempId !== id && x.payload?.id !== id) })),
        removeCardAction: (id: string) => setState((s) => ({ ...s, cardActionQueue: s.cardActionQueue.filter((x: any) => x.payload?.tempId !== id && x.payload?.id !== id) })),
    };
    return <QueueContext.Provider value={api}>{children}</QueueContext.Provider>;
}

export function useMockOrganization() {
    return useContext(OrgContext);
}

export function useMockQueue() {
    return useContext(QueueContext);
}

export function MockAppProvider({ children }: { children: React.ReactNode }) {
    return (
        <MockOrganizationProvider>
            <MockQueueProvider>{children}</MockQueueProvider>
        </MockOrganizationProvider>
    );
}
