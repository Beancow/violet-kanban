const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
    preset: 'ts-jest',
    // Default to jsdom environment so React tests have the expected globals
    // and the environment provides `moduleMocker`. Individual tests that need
    // a node environment can still opt out using a per-file docblock.
    testEnvironment: 'jsdom',
    testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
    // Ensure jest resolves react/react-dom to this repo's installed copies
    // (helps prevent duplicate React copies when tests mock modules or when
    // linked packages bring their own copies).
    moduleNameMapper: {
        '^react$': '<rootDir>/node_modules/react',
        '^react-dom$': '<rootDir>/node_modules/react-dom',
        ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
            prefix: '<rootDir>/',
        }),
    },
    // Configure ts-jest using the `transform` entry to avoid the deprecated
    // `globals['ts-jest']` usage. See ts-jest docs for advanced options:
    // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: {
                    jsx: 'react-jsx',
                },
                // Disable ts-jest diagnostics during test runs to reduce noise
                // (type errors should still be caught by your CI `tsc --noEmit` step).
                diagnostics: false,
            },
        ],
    },
    // Global timeout (ms) for individual tests to prevent long-running/hanging tests
    testTimeout: 10000,
    // Run the TypeScript setup file so jest-dom and other test shims are loaded
    setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
};
