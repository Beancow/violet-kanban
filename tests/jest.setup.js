// Jest setup: provide minimal browser-like globals that tests rely on
// - mock Worker so components that instantiate a Worker won't create a real one
// - provide a simple localStorage shim
// - no-op addEventListener/removeEventListener to avoid side-effects
// - set a reasonable global timeout

// Mock Worker
class TestWorker {
    constructor() {}
    postMessage() {}
    terminate() {}
}

if (typeof global !== 'undefined') {
    global.Worker = TestWorker;
}

if (typeof window !== 'undefined') {
    // localStorage shim
    if (!window.localStorage) {
        const store = Object.create(null);
        window.localStorage = {
            getItem: (k) => (k in store ? store[k] : null),
            setItem: (k, v) => (store[k] = String(v)),
            removeItem: (k) => delete store[k],
            clear: () => {
                for (const k in store) delete store[k];
            },
        };
    }

    if (!window.addEventListener) {
        window.addEventListener = () => {};
    }
    if (!window.removeEventListener) {
        window.removeEventListener = () => {};
    }
}

// Ensure tests don't hang too long
if (typeof jest !== 'undefined' && typeof jest.setTimeout === 'function') {
    jest.setTimeout(10000);
}
