module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
    moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/providers/(.*)$': '<rootDir>/src/providers/$1',
    },
};
