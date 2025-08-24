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
                    // Build endpoint from action.type (naive mapping used in real worker)
                    let endpoint: string | null = null;
                    if (action.type === 'create-card')
                        endpoint = '/api/cards/create';
                    if (action.type === 'create-list')
                        endpoint = '/api/lists/create';
                    if (action.type === 'create-board')
                        endpoint = '/api/boards/create';

                    if (endpoint && typeof fetchImpl === 'function') {
                        const body = {
                            data: action.payload?.data,
                            boardId: action.payload?.boardId,
                            listId: action.payload?.listId,
                        };
                        const res = await (fetchImpl as any)(endpoint, {
                            method: 'POST',
                            body: JSON.stringify(body),
                        } as any);
                        if (res && res.ok) {
                            const json = await res.json();
                            const payload: any = {
                                timestamp: action.timestamp,
                            };
                            if (action.type === 'create-card')
                                payload.card = json?.data?.card || json?.card;
                            if (action.type === 'create-list')
                                payload.list = json?.data?.list || json?.list;
                            if (action.type === 'create-board')
                                payload.board =
                                    json?.data?.board || json?.board;
                            // attach tempId if present
                            if (action.payload?.tempId)
                                payload.tempId = action.payload.tempId;
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
                                        timestamp: action.timestamp,
                                        type: action.type,
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
