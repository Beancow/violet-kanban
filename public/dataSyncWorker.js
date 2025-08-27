// Lightweight data sync worker for offline queue processing.
// - Keeps network requests minimal
// - Forwards organizationId via X-Organization-Id header when present
// --- Generic Action handlers ---------------------------------------------
const CREATE_CONFIG = {
    'create-board': {
        endpoint: '/api/boards/create',
        bodyFrom: (p) => ({ data: p.data }),
        resultKey: 'board',
    },
    'create-list': {
        endpoint: '/api/lists/create',
        bodyFrom: (p) => ({ data: p.data, boardId: p.boardId }),
        resultKey: 'list',
    },
    'create-card': {
        endpoint: '/api/cards/create',
        bodyFrom: (p) => ({
            data: p.data,
            boardId: p.boardId,
            listId: p.listId,
        }),
        resultKey: 'card',
    },
    'create-organization': {
        endpoint: '/api/orgs/create',
        // strip idToken from body while preserving it for headers
        bodyFrom: (p) => {
            const { idToken, ...rest } = p || {};
            return { ...(rest || {}) };
        },
        resultKey: null,
    },
};

const UPDATE_CONFIG = {
    'update-board': {
        endpoint: '/api/boards/update',
        bodyFrom: (p) => ({ data: p.data }),
    },
    'update-card': {
        endpoint: '/api/cards/update',
        bodyFrom: (p) => ({ data: p.data }),
    },
    'restore-card': {
        endpoint: '/api/cards/restore',
        bodyFrom: (p) => ({ id: p.id }),
    },
    // future: update-list
};

const DELETE_CONFIG = {
    'delete-card': {
        endpoint: '/api/cards/delete',
        bodyFrom: (p) => ({ id: p.id }),
    },
    'soft-delete-card': {
        endpoint: '/api/cards/soft-delete',
        bodyFrom: (p) => ({ id: p.id }),
    },
    'delete-list': {
        endpoint: '/api/lists/delete',
        bodyFrom: (p) => ({ id: p.id }),
    },
    'delete-board': {
        endpoint: '/api/boards/delete',
        bodyFrom: (p) => ({ id: p.id }),
    },
};

// Helper to POST JSON from the worker. Honors optional idToken and
// organizationId fields passed via `opts` so callers can include auth
// headers without placing them in the request body.
async function sendPost(endpoint, body, opts) {
    opts = opts || {};
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (opts.idToken) headers['Authorization'] = `Bearer ${opts.idToken}`;
        if (opts.organizationId)
            headers['X-Organization-Id'] = String(opts.organizationId);

        // Use fetch available in worker context
        const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body || {}),
        });
        return res;
    } catch (err) {
        // Re-throw so callers handle messaging
        throw err;
    }
}

async function handleCreateGeneric(action) {
    const cfg = CREATE_CONFIG[action.type];
    if (!cfg) return;
    const payload = action.payload || {};
    const body = cfg.bodyFrom(payload);
    const response = await sendPost(cfg.endpoint, body, {
        ...payload,
        tempId: payload.tempId,
        timestamp: action.timestamp,
    });

    if (response.ok) {
        const json = await response.json().catch(() => ({}));
        const responseData = json.data || json || {};
        const out = {
            timestamp: action.timestamp,
            type: action.type,
        };
        if (payload.tempId) out.tempId = payload.tempId;
        if (cfg.resultKey) {
            out[cfg.resultKey] = responseData?.[cfg.resultKey] || null;
        } else {
            // organization create returns variable shape; spread server data
            Object.assign(out, responseData || {});
        }
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: out,
            meta: { origin: 'worker' },
        });
        return;
    }

    let errorBody = null;
    try {
        errorBody = await response.json();
    } catch (e) {}

    self.postMessage({
        type: 'ERROR',
        payload: { timestamp: action.timestamp, type: action.type },
        error: { message: errorBody?.error || `Failed to ${action.type}` },
        meta: { origin: 'worker' },
    });
}

async function handleUpdateGeneric(action) {
    const cfg = UPDATE_CONFIG[action.type];
    if (!cfg) return;
    const payload = action.payload || {};
    const body = cfg.bodyFrom(payload);
    const response = await sendPost(cfg.endpoint, body, {
        ...payload,
        timestamp: action.timestamp,
    });

    if (response.ok) {
        // Include identifying fields from the request body so the main
        // thread can correlate ACTION_SUCCESS with local records and run
        // reconciliation (for example, delete a board with the given id).
        const successPayload = { timestamp: action.timestamp, ...(body || {}) };
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: successPayload,
            meta: { origin: 'worker' },
        });
        return;
    }

    self.postMessage({
        type: 'ERROR',
        payload: { timestamp: action.timestamp },
        error: { message: `Failed to ${action.type}` },
        meta: { origin: 'worker' },
    });
}

async function handleDeleteGeneric(action) {
    const cfg = DELETE_CONFIG[action.type];
    if (!cfg) return;
    const payload = action.payload || {};
    const body = cfg.bodyFrom(payload);
    const response = await sendPost(cfg.endpoint, body, {
        ...payload,
        timestamp: action.timestamp,
    });

    if (response.ok) {
        // For updates, include the request body so consumers can detect the
        // affected id(s) and reconcile local state accordingly.
        const successPayload = { timestamp: action.timestamp, ...(body || {}) };
        self.postMessage({
            type: 'ACTION_SUCCESS',
            payload: successPayload,
            meta: { origin: 'worker' },
        });
        return;
    }

    self.postMessage({
        type: 'ERROR',
        payload: { timestamp: action.timestamp, type: action.type },
        error: { message: `Failed to ${action.type}` },
        meta: { origin: 'worker' },
    });
}

// Worker verbosity: initial value comes from the worker script URL query
// parameter `?verbose=1|true`. It can also be toggled at runtime by the
// main thread sending a `{ type: 'SET_WORKER_VERBOSE', verbose: true }`
// message to the worker.
let VERBOSE = false;
try {
    if (typeof self !== 'undefined' && self.location && self.location.href) {
        try {
            const params = new URL(self.location.href).searchParams;
            const v = params.get('verbose');
            VERBOSE = v === '1' || v === 'true';
        } catch (err) {
            if (VERBOSE)
                console.error(
                    '🔍 [Worker] Failed to parse verbose query param from worker URL',
                    err
                );
        }
    }
} catch (err) {
    if (VERBOSE)
        console.error(
            '🔍 [Worker] Error while accessing self.location to read verbose param',
            err
        );
}

function setVerbose(v) {
    VERBOSE = !!v;
}

function isVerbose() {
    return VERBOSE;
}

// Worker versioning
const WORKER_VERSION = '1.0.0';

self.onmessage = async function (e) {
    // Check for version request
    if (e.data && e.data.type === 'GET_WORKER_VERSION') {
        self.postMessage({ type: 'WORKER_VERSION', version: WORKER_VERSION });
        return;
    }

    // Allow the main thread to toggle verbose logging at runtime
    if (e.data && e.data.type === 'SET_WORKER_VERBOSE') {
        try {
            const v = !!e.data.verbose;
            setVerbose(v);
            self.postMessage({
                type: 'WORKER_VERBOSE_SET',
                verbose: isVerbose(),
                meta: { origin: 'worker' },
            });
        } catch (err) {
            if (isVerbose())
                console.error(
                    '🔍 [Worker] Failed to set verbose flag from main thread message',
                    err
                );
        }
        return;
    }

    const action = e.data;
    try {
        // Route generic create/update/delete actions via config maps
        if (action && CREATE_CONFIG[action.type]) {
            await handleCreateGeneric(action);
            return;
        }

        if (action && UPDATE_CONFIG[action.type]) {
            await handleUpdateGeneric(action);
            return;
        }

        if (action && DELETE_CONFIG[action.type]) {
            await handleDeleteGeneric(action);
            return;
        }

        // Fallback for any specialized handlers that may exist
        if (
            action &&
            action.type === 'fetch-org-data' &&
            typeof handleFetchOrgData === 'function'
        ) {
            await handleFetchOrgData(action);
            return;
        }

        // Unknown action
        console.error(
            `🔴🤖 [Worker] Unknown message type: ${action?.type} @ ${action?.timestamp}`,
            action
        );
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action?.timestamp, type: action?.type },
            error: { message: `Unknown message type: ${action?.type}` },
            meta: { origin: 'worker' },
        });
    } catch (error) {
        console.error(
            `🔴🤖 [Worker] Error in action handler @ ${action?.timestamp}:`,
            error
        );
        self.postMessage({
            type: 'ERROR',
            payload: { timestamp: action?.timestamp, type: action?.type },
            error: {
                message:
                    error?.message || 'An unknown error occurred in the worker',
            },
            meta: { origin: 'worker' },
        });
    }
};

self.postMessage({
    type: 'WORKER_VERSION',
    version: WORKER_VERSION,
    meta: { origin: 'worker' },
});
self.postMessage({
    type: 'WORKER_READY',
    version: WORKER_VERSION,
    meta: { origin: 'worker' },
});
