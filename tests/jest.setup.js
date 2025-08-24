// Jest setup: provide minimal browser-like globals that tests rely on
// - mock Worker so components that instantiate a Worker won't create a real one
// - provide a simple localStorage shim
// - no-op addEventListener/removeEventListener to avoid side-effects
// - set a reasonable global timeout

// extend jest matchers with DOM assertions (toBeInTheDocument, etc.)
try {
    // require in a try/catch to keep setup resilient if package is missing
    // (tests will fail later with a clearer error)
    require('@testing-library/jest-dom');
} catch (e) {
    // noop - package may not be installed in some environments
}

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

// React 18 requires tests to opt into a special "act" environment flag so that
// `act(...)` works correctly. Set it here for all tests that use jsdom.
if (typeof global !== 'undefined') {
    // This flag is checked by React's test utilities. It must be true for
    // `act` to work and avoid the console error about the environment.
    global.IS_REACT_ACT_ENVIRONMENT = true;
}
