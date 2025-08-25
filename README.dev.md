Developer notes — local dev & emulators

This file contains quick, copy-paste commands and tips for bootstrapping local development with the Firebase emulators, seeding data, and running the app in a way that mirrors the team's workflow.

1. Install

```bash
npm install
```

2. Import the shipped emulator data (recommended)

The repository includes an `firebase-emulator-data/` folder with exported Firestore and Auth data. Importing it makes local testing fast and reproducible.

```bash
# start emulators and import existing export
firebase emulators:start --import=./firebase-emulator-data

# if you prefer interactive emulator UI (default port 4000)
# open http://localhost:4000
```

Notes:

-   The `firebase.json` file configures emulator ports. Firestore is configured on port 8080 and Auth on 9099 by default.
-   Use `--export-on-exit=./firebase-emulator-data` to persist runtime changes back to disk when you stop the emulators.

3. Start the app (defaults disable Sentry locally)

```bash
# standard dev (Sentry disabled via env in the script)
npm run dev

# development with Sentry enabled (only do this when you want to send events)
npm run dev:with-sentry

# dev with firebase-admin debug logging
npm run dev:firebase-debug
```

4. Test accounts / Auth emulator

-   The Auth emulator UI is available in the Firebase emulator UI. You can also inspect `/firebase-emulator-data/auth_export/accounts.json` for sample accounts.
-   To create test accounts programmatically, use the Firebase Admin SDK pointed at the emulator (the repo includes helpers and debug flags for admin flows).

5. Common troubleshooting & tips

-   Storage: auth metadata is persisted under `violet-kanban-auth-v1` in localStorage. Tokens are never persisted.
-   Sentry: toggles are controlled by env vars:
    -   `DISABLE_SENTRY=1` (server)
    -   `NEXT_PUBLIC_DISABLE_SENTRY=1` (client)
        The default `npm run dev` script sets both to `1` to avoid accidental event submission.
-   If events show tokens or secrets, update `src/lib/sentryWrapper.ts` sanitize rules.

6. Tests

```bash
# run unit + integration tests (jest)
npm test

# smoke tests
npm run test:smoke

# Playwright e2e
npm run test:e2e
```

7. Useful environment variables

-   `DEBUG_FIREBASE_ADMIN=1` — enable extra admin-side debug logs (used by `dev:firebase-debug`).
-   `DISABLE_SENTRY`, `NEXT_PUBLIC_DISABLE_SENTRY` — prevent Sentry initialization locally.

8. Exporting emulator state

```bash
# export current emulator data to a directory
firebase emulators:export ./firebase-emulator-data
```

9. Where to look in the repo

-   Emulator config: `firebase.json`
-   Auth helper + config: `src/lib/firebase` and `src/providers/AuthProvider.tsx`
-   Sentry wrapper and sanitizer: `src/lib/sentryWrapper.ts`
-   Provider persistence helpers: `src/providers/persist.ts`

If you'd like, I can add a small script that runs the emulators with the recommended flags and imports automatically (for example, `scripts/dev-emulators` in `package.json`).
