// Test setup for Jest (TypeScript). This file is executed before each test suite.
// Import helpful matchers and any global shims used across tests.

import '@testing-library/jest-dom';

// Minimal global shims that some tests assume (workers, window helpers, etc.)
// These are intentionally non-invasive and only provide what tests commonly need.
// For more advanced shims use tests/jest.setup.js or expand this file.

// Make `global.window` available in the Node test environment if not present
if (typeof (global as any).window === 'undefined') {
    (global as any).window = {} as any;
}

// Enable React's `act(...)` testing environment flag so test renderers and
// utilities behave correctly under Jest (React 18+ requires this flag).
// See: https://reactjs.org/docs/test-utils.html#act
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Provide basic addEventListener/removeEventListener stubs if not present
(global as any).window.addEventListener =
    (global as any).window.addEventListener || (() => {});
(global as any).window.removeEventListener =
    (global as any).window.removeEventListener || (() => {});

// Expose Jest helpers to the TypeScript environment via triple-slash types in tests/tsconfig
// (the types are already included in tests/tsconfig.json)

export {};
