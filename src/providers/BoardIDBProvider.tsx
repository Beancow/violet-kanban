'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import BoardStore, { BoardRecord } from '@/stores/BoardStore';
import { useOrganizationProvider } from './OrganizationProvider';
import useFreshToken from '@/hooks/useFreshToken';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel';
import { safeCaptureException } from '@/lib/sentryWrapper';

type BoardApi = {
    state: { boards: BoardRecord[] };
    addBoard: (b: BoardRecord) => void;
    updateBoard: (b: Partial<BoardRecord> & { id: string }) => void;
    removeBoard: (id: string) => void;
    setBoards: (bs: BoardRecord[]) => void;
};

const BoardContext = createContext<BoardApi | null>(null);

export function BoardIDBProvider({ children }: { children: ReactNode }) {
    const org = useOrganizationProvider();
    const getFreshToken = useFreshToken();
    const [state, setState] = useState<{ boards: BoardRecord[] }>({
        boards: [],
    });
    const bc = useBroadcastChannel('vk:boards:channel', async (m: any) => {
        try {
            if (!m || !m.type) return;
            if (
                m.type === 'boards:updated' &&
                m.orgId === org.currentOrganizationId
            ) {
                // refresh from IDB
                const refreshed = await BoardStore.getAll(
                    org.currentOrganizationId as string
                );
                setState({ boards: refreshed });
            }
        } catch (e) {
            safeCaptureException(e as Error);
        }
    });

    // hydrate from IDB when org changes
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const orgId = org.currentOrganizationId;
                if (!orgId) {
                    setState({ boards: [] });
                    return;
                }
                // prefer fresh fetch from server when possible
                try {
                    const token = await getFreshToken();
                    const headers: Record<string, string> = {};
                    if (token) headers.Authorization = `Bearer ${token}`;
                    if (orgId) headers['x-organization-id'] = orgId;
                    const res = await fetch('/api/boards', {
                        method: 'GET',
                        headers,
                    });
                    if (res.ok) {
                        const body = await res.json().catch(() => null);
                        if (
                            body &&
                            body.success &&
                            Array.isArray(body.boards)
                        ) {
                            const bs: BoardRecord[] = body.boards.map(
                                (b: any) => ({ ...b })
                            );
                            // write to IDB and local state
                            await Promise.all(bs.map((b) => BoardStore.put(b)));
                            if (!mounted) return;
                            setState({ boards: bs });
                            try {
                                bc.post({ type: 'boards:updated', orgId });
                            } catch (_) {}
                            return;
                        }
                    }
                } catch (e) {
                    // fetch failed; fall back to IDB
                }

                const boards = await BoardStore.getAll(orgId);
                if (!mounted) return;
                setState({ boards });
            } catch (e) {
                safeCaptureException(e as Error);
            }
        })();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [org.currentOrganizationId]);

    const api: BoardApi = {
        state,
        addBoard: async (b: BoardRecord) => {
            try {
                await BoardStore.put(b);
                setState((s) => ({ boards: s.boards.concat([b]) }));
                try {
                    bc.post({
                        type: 'boards:updated',
                        orgId: b.organizationId,
                    });
                } catch (_) {}
            } catch (e) {
                safeCaptureException(e as Error);
            }
        },
        updateBoard: async (b) => {
            try {
                await BoardStore.put({ ...(b as any) } as BoardRecord);
                setState((s) => ({
                    boards: s.boards.map((x) =>
                        x.id === b.id ? { ...x, ...(b as any) } : x
                    ),
                }));
                try {
                    bc.post({
                        type: 'boards:updated',
                        orgId: (b as any).organizationId,
                    });
                } catch (_) {}
            } catch (e) {
                safeCaptureException(e as Error);
            }
        },
        removeBoard: async (id: string) => {
            try {
                const existing = await BoardStore.get(id);
                await BoardStore.delete(id);
                setState((s) => ({
                    boards: s.boards.filter((x) => x.id !== id),
                }));
                try {
                    bc.post({
                        type: 'boards:updated',
                        orgId: existing?.organizationId,
                    });
                } catch (_) {}
            } catch (e) {
                safeCaptureException(e as Error);
            }
        },
        setBoards: async (bs: BoardRecord[]) => {
            try {
                // bulk write
                await Promise.all(bs.map((b) => BoardStore.put(b)));
                setState({ boards: bs });
                try {
                    bc.post({
                        type: 'boards:updated',
                        orgId: bs[0]?.organizationId,
                    });
                } catch (_) {}
            } catch (e) {
                safeCaptureException(e as Error);
            }
        },
    };

    return (
        <BoardContext.Provider value={api}>{children}</BoardContext.Provider>
    );
}

export function useBoards() {
    const ctx = useContext(BoardContext);
    if (!ctx) throw new Error('useBoards must be used within BoardIDBProvider');
    return ctx;
}

export default BoardIDBProvider;
