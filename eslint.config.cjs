module.exports = [
    // top-level ignores
    { ignores: ['.next/', 'node_modules/', 'firebase-emulator-data/'] },

    // Minimal TypeScript override. We avoid using `extends` to keep the flat
    // config simple and avoid requiring shareable configs that use `extends`.
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: require('@typescript-eslint/parser'),
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
                project: './tsconfig.json',
            },
        },
        plugins: {
            '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
            'react-hooks': require('eslint-plugin-react-hooks'),
        },
        rules: {
            // Use the TS-aware no-unused-vars rule
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            // Keep react-hooks/exhaustive-deps off here; we rely on developers
            // to manage hook deps and avoid pulling the rule into the build.
            'react-hooks/exhaustive-deps': 'off',
            // Prevent accidental use of the `@/src/...` alias (resolves to src/src/...)
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: '@/src',
                            message:
                                "Do not import from '@/src' — use '@/...' (maps to src/*).",
                        },
                    ],
                    patterns: ['@/src/*'],
                },
            ],
        },
    },
];
