# Violet Kanban — developer notes

This repo contains the Violet Kanban application. The following notes focus on non-standard scripts, developer workflows, local emulators, persistence keys, and important implementation details you should know when working on the codebase.

## Quick scripts you should know

-   `npm run dev` — runs Next.js in development with Sentry disabled by default (see Sentry section). This is the standard local dev entrypoint.
-   `npm run dev:with-sentry` — run local dev with Sentry enabled (do not use unless you want events reported to your Sentry project).
-   `npm run dev:firebase-debug` — runs dev with extra Firebase admin debug env enabled.
-   `npm run test` — run Jest tests (fast unit/integration runs).
-   `npm run test:smoke` — run smoke tests only.
-   `npm run test:e2e` — run Playwright E2E tests locally.

All scripts are defined in `package.json`.

## Local emulator & debug tips

-   Firebase emulators data and config are present under `firebase-emulator-data/` and `firebase.json`. If you run the local Firebase emulators, the app is configured to work with them in many places.
-   For Firebase admin debug behavior, use `DEBUG_FIREBASE_ADMIN=1` (there are helper scripts that set this env for build/dev scripts in `package.json`).

## Sentry controls and safe reporting

-   The project includes a lightweight Sentry wrapper at `src/lib/sentryWrapper.ts`. It lazily loads `@sentry/nextjs` on the server and provides no-op fallbacks when Sentry is disabled.
-   Local toggles:
    -   `DISABLE_SENTRY=1` prevents server Sentry initialization.
    -   `NEXT_PUBLIC_DISABLE_SENTRY=1` prevents client Sentry initialization.
-   The default `npm run dev` script sets both of the above to `1`, preventing accidental local events.
-   Important: errors are sent through a `safeCaptureException` helper which sanitizes payloads to redact tokens and other sensitive fields before sending to Sentry or logging fallbacks. If you need more redaction rules, update `src/lib/sentryWrapper.ts`.

## Auth & Token handling

-   ID tokens are intentionally not persisted to disk/localStorage. Persistent auth state is limited to a small non-sensitive payload: `hasAuth`, `storedUser`, `lastAuthAt`.
-   The storage key used for auth metadata is `violet-kanban-auth-v1` (see `src/providers/AuthProvider.tsx`). Do not store tokens to localStorage.
-   A helper `src/lib/firebase/firebaseHelpers.ts` exists with utilities for token expiry detection (client-only). It will throw if used in a Node/server context.
-   The app attempts proactive token refreshes (heuristic: refresh around the 50-minute mark of a 1-hour token) based on token expiry or `lastAuthAt` timestamp.

## Provider-backed state (no Zustand singletons)

-   The app now uses React context providers under `src/providers/*` to host application state. Providers encapsulate lifecycle, persistence, and queueing.
-   Important providers to look at:
    -   `AuthProvider` — auth state, token refresh, persisted auth metadata
    -   `BoardProvider`, `ListProvider`, `CardProvider`, `QueueProvider`, `TempIdMapProvider` — core app state and local persistence
-   Persistence pattern: providers read synchronously from localStorage on init and write back via useEffect when their state changes. See `src/providers/persist.ts` for helpers and examples.

## LocalStorage keys & conventions

-   `violet-kanban-auth-v1` — auth metadata (see above).
-   Many providers use versioned keys in localStorage; check each provider for the exact key name if you need to inspect stored state.
-   Providers intentionally avoid storing sensitive tokens — they persist minimal, non-sensitive metadata only.

## Developer patterns and utilities

-   Use helpers in `src/utils/` and `src/types/` for common behavior (patch builders, type helpers, etc.).
-   When writing update/patch functions, prefer `buildPatch<T>(...)` and the `PartialWithRequiredId<T>` patterns to avoid accidental overwrites.
-   Queue and temp-id helpers are available through `src/providers/useVioletKanbanHooks.ts`.

## Troubleshooting & debugging

-   If Sentry seems to be swallowing failures locally, confirm `DISABLE_SENTRY` and `NEXT_PUBLIC_DISABLE_SENTRY` aren't set (or use `dev:with-sentry`), and inspect console output (the wrapper falls back to console on failures).
-   If you see tokens in logs or Sentry events, update `src/lib/sentryWrapper.ts` sanitize rules immediately.
-   If React context providers are missing state, ensure the application layout wraps the relevant subtree with the appropriate provider(s). Providers are instantiated in `src/providers` and wired into `app/layout.tsx`.

## Tests and CI notes

-   Fast local checks: run `npm test` for Jest tests and `npm exec --silent tsc -- --noEmit` for a full typecheck.
-   E2E runs use Playwright. CI may run Playwright with a GitHub reporter; check `package.json` for specifics.

## Where to look next

-   `src/providers/` — provider implementations and persistence patterns.
-   `src/lib/sentryWrapper.ts` — Sentry wrapper and sanitization logic.
-   `src/lib/firebase/` — firebase config and helpers (client-only token helpers live here).
