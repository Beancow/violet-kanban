module.exports = {
    preset: 'ts-jest',
    // Default to node environment for Jest; individual tests that need
    // a DOM-like environment should opt in via a per-file docblock
    // (`/* @jest-environment jsdom */`) to avoid runtime mismatches.
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/providers/(.*)$': '<rootDir>/src/providers/$1',
        // Redirect legacy store imports to a test shim that delegates to providers
        '^@/store/(.*)$': '<rootDir>/tests/__mocks__/storeShim.ts',
    },
    globals: {
        'ts-jest': {
            tsconfig: {
                jsx: 'react-jsx',
            },
        },
    },
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    // Global timeout (ms) for individual tests to prevent long-running/hanging tests
    testTimeout: 10000,
    setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
};
