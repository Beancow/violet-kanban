# Developer Quick Checklist

This file contains quick commands and recommended workflows for local development.

## Tests

-   Run all Jest tests (fast local runs):

```bash
npm test
```

-   Run a single test file (example):

```bash
npx jest tests/components/modals/CreateBoardModal.test.tsx --runTestsByPath -i --runInBand --verbose
```

-   Run smoke tests:

```bash
npm run test:smoke
```

-   Run Playwright E2E locally:

```bash
npm run test:e2e
```

## Lint

-   Run the project's linter:

```bash
npm run lint
```

## Type checking

-   Run strict TypeScript type checks (no emit):

```bash
npx tsc --noEmit
```

> Recommended workflow: run Jest while developing for fast feedback, and rely on `npx tsc --noEmit` in CI to enforce strict typing before merges.

## Notes

-   The repo uses `ts-jest` for TypeScript Jest support. Tests run faster if you limit to specific test files during development.
-   If you need to seed test providers, see `tests/utils/renderWithProviders.tsx` and `tests/utils/providerMocks.ts`.

## Example GitHub Actions CI snippet

Add this as `.github/workflows/ci.yml` to run tests and type checks on push/PRs:

```yaml
name: CI

on: [push, pull_request]

jobs:
	test:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- name: Use Node.js
				uses: actions/setup-node@v4
				with:
					node-version: 18
			- name: Install dependencies
				run: npm ci
			- name: Run Jest
				run: npm test
			- name: Type check
				run: npx tsc --noEmit
```
