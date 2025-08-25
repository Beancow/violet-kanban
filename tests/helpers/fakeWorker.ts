// Minimal fake Worker for tests — lets tests intercept postMessage and simulate
// the worker calling back into the page via onmessage.

export type FakeWorkerOptions = {
    // an optional fetch impl (jest mock) - if not provided uses global.fetch
    fetchImpl?: typeof fetch;
};

export function installFakeWorker(options?: FakeWorkerOptions) {
    const fetchImpl = options?.fetchImpl || (global as any).fetch;

    class FakeWorker {
        url: string;
        onmessage: ((ev: { data: any }) => void) | null = null;
        onerror: ((ev: any) => void) | null = null;

        constructor(url: string) {
            this.url = url;
            // expose this instance for tests
            try {
                (global as any).__lastFakeWorker = this;
            } catch (e) {
                /* ignore */
            }
            // mimic worker ready notification
            setTimeout(() => {
                if (this.onmessage) {
                    this.onmessage({
                        data: { type: 'WORKER_READY', version: 'test-fake' },
                    });
                }
            }, 0);
        }

        postMessage(action: any) {
            // Basic emulation: for create-*/update-*/delete-* actions call fetchImpl
            // and then call onmessage with ACTION_SUCCESS or ERROR depending on response.ok
            (async () => {
                try {
                    // Support a SYNC_DATA wrapper (used by SyncManager) by
                    // extracting the inner action when present. Many tests post
                    // messages in the shape { type: 'SYNC_DATA', payload: <action> }
                    // while some tests may post actions directly. Normalize to
                    // `inner` with { type, payload, timestamp } shape.
                    const inner =
                        action && action.type === 'SYNC_DATA' && action.payload
                            ? action.payload
                            : action;

                    // Build endpoint from inner.type (naive mapping used in real worker)
                    let endpoint: string | null = null;
                    const actType = inner?.type;
                    // Support worker version queries used by useWebWorker
                    if (actType === 'GET_WORKER_VERSION') {
                        if (this.onmessage)
                            this.onmessage({
                                data: {
                                    type: 'WORKER_VERSION',
                                    version: 'test-fake',
                                },
                            });
                        return;
                    }
                    if (actType === 'create-card')
                        endpoint = '/api/cards/create';
                    if (actType === 'create-list')
                        endpoint = '/api/lists/create';
                    if (actType === 'create-board')
                        endpoint = '/api/boards/create';

                    if (endpoint && typeof fetchImpl === 'function') {
                        const body = {
                            data: inner.payload?.data,
                            boardId: inner.payload?.boardId,
                            listId: inner.payload?.listId,
                        };
                        const res = await (fetchImpl as any)(endpoint, {
                            method: 'POST',
                            body: JSON.stringify(body),
                        } as any);
                        if (res && res.ok) {
                            const json = await res.json();
                            const payload: any = {
                                timestamp:
                                    inner.timestamp ||
                                    action.timestamp ||
                                    Date.now(),
                            };
                            if (actType === 'create-card')
                                payload.card = json?.data?.card || json?.card;
                            if (actType === 'create-list')
                                payload.list = json?.data?.list || json?.list;
                            if (actType === 'create-board')
                                payload.board =
                                    json?.data?.board || json?.board;
                            // attach tempId if present
                            if (inner.payload?.tempId)
                                payload.tempId = inner.payload.tempId;
                            if (this.onmessage)
                                this.onmessage({
                                    data: { type: 'ACTION_SUCCESS', payload },
                                });
                            return;
                        }
                        // non-ok
                        const err = res && (await res.json()).error;
                        if (this.onmessage)
                            this.onmessage({
                                data: {
                                    type: 'ERROR',
                                    payload: {
                                        timestamp:
                                            inner.timestamp || action.timestamp,
                                        type: actType,
                                    },
                                    error: { message: err || 'mock error' },
                                },
                            });
                        return;
                    }

                    // Unknown action -> reply error
                    if (this.onmessage)
                        this.onmessage({
                            data: {
                                type: 'ERROR',
                                payload: {
                                    timestamp: action.timestamp,
                                    type: action.type,
                                },
                                error: {
                                    message: 'unhandled action in fake worker',
                                },
                            },
                        });
                } catch (e: any) {
                    if (this.onmessage)
                        this.onmessage({
                            data: {
                                type: 'ERROR',
                                payload: {
                                    timestamp: action.timestamp,
                                    type: action.type,
                                },
                                error: { message: e?.message || String(e) },
                            },
                        });
                }
            })();
        }

        terminate() {
            // noop
        }
    }

    // install into global scope
    (global as any).Worker = FakeWorker as any;
    return FakeWorker;
}

export function uninstallFakeWorker() {
    delete (global as any).Worker;
}
