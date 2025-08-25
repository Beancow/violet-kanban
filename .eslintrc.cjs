/**
 * Minimal ESLint wrapper to enable Next.js' plugin/config detection.
 *
 * We keep the project's existing flat `eslint.config.cjs` but also provide
 * this legacy-style config so Next.js' `next lint` and its plugin detection
 * find the `next` config automatically. This file intentionally only
 * extends Next's recommended configuration.
 */
/**
 * Compatibility shim so Next.js' CLI/plugin detection recognizes the project
 * has an ESLint configuration. The real, authoritative config is the flat
 * `eslint.config.cjs` file in the repo root; this file only exists to quiet
 * Next's informational detection message and should not be used as the
 * primary place to edit rules.
 */
module.exports = {
    root: true,
    extends: ['next/core-web-vitals'],
};
module.exports = {
    root: true,
    ignorePatterns: ['.next/', 'node_modules/', 'firebase-emulator-data/'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
    },
};
