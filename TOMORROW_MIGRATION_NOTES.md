Date: 2025-08-22

Quick context

-   Working on replacing Zustand stores in `src/store/**` with React providers (Context + useReducer + immer) and adapters for non-React callers.
-   Recent manual edits: you updated `src/components/SyncManager.tsx`, `src/components/forms/BoardFormWrapper.tsx`, `src/components/forms/CardFormWrapper.tsx`, and `src/components/navigation/UserMenu.tsx`.
-   I migrated several consumers to provider hooks and added adapter usage in `SyncManager` earlier; we ran `npx tsc --noEmit` and fixed some type issues.

What I changed most recently

-   `src/app/boards/page.tsx` → switched to `useOrganizationProvider`
-   `src/components/SyncManager.tsx` → rewired to use provider adapters/hooks (note: you made manual edits afterward)
-   `src/hooks/useCreatedBy.ts` → use `user.id` instead of `user.uid`

Current TypeScript status (last run)

-   Running `npx tsc --noEmit` produced 9 errors remaining:
    -   Next.js API request type mismatch: several API route handlers pass `Request` to helpers expecting `NextRequest` (files under `src/app/api/cards/*/route.ts` and `src/app/api/lists/*/route.ts`).
    -   `CreateOrEditOrganizationModal.tsx` renders `OrganizationForm` without the required `form` prop.
    -   Storybook typing errors in `src/components/Toast.stories.tsx`.
-   Store-related blockers (legacy `getOrCreate*` usage) were reduced; `SyncManager` no longer uses `getOrCreate*` directly (but you manually edited it — double-check your changes tomorrow).

Suggested next steps (pick one)

-   Option A — Quick compatibility shims (recommended if you want a fast green compile):
    -   Add small shim modules that re-export or delegate the legacy `getOrCreateAuthStore`, `getOrCreateOrganizationStore`, and `useSyncErrorStore.getState()` surfaces to provider adapters. This lets the rest of the codebase compile while you finish migrating callers.
-   Option B — Continue full refactor (clean, longer):
    -   Finish converting remaining non-React pieces (workers, `SyncManager`, utilities) to call provider adapters or accept dependency injection.

Practical checklist for tomorrow

-   Pull latest changes and open workspace.
-   Run:
    ```bash
    npx tsc --noEmit
    ```
-   Inspect/handle these in order:
    1. `src/app/api/*/route.ts` — resolve `Request` vs `NextRequest` mismatch by updating helper signatures or callers.
    2. `src/components/modals/CreateOrEditOrganizationModal.tsx` → pass the `form` prop to `OrganizationForm` (or update prop types if intended).
    3. `src/components/Toast.stories.tsx` → fix story args/argTypes typing to satisfy Storybook types.
    4. Re-open `src/components/SyncManager.tsx` (you edited it): confirm it uses provider adapter APIs consistently and that `QueueProvider`/`AuthProvider`/`OrganizationProvider` are mounted in the app root.
    5. Grep for any remaining `@/store/` imports and decide shim vs refactor per file.
-   If you want the fast route, implement shims now and re-run `npx tsc --noEmit` until only the non-store errors remain. Otherwise continue per-file refactors.

Commands to run (tomorrow)

-   Typecheck: `npx tsc --noEmit`
-   Start dev server: `pnpm dev` or `npm run dev` (project uses package.json — pick your usual command)
-   Quick search for legacy imports:
    ```bash
    rg "@/store/" -n
    ```

Notes / questions to answer tomorrow

-   Do you prefer Option A (shims) or Option B (full refactor)? I'll implement whichever you choose.
-   Confirm whether the app has a top-level `AppProviders` wrapper mounted (providers must be present for hooks to work).

Short-term follow-ups I can do now if you want (pick any):

-   Add temporary shims for `getOrCreate*` to stop compile-time failures.
-   Finish converting remaining components that still import `@/store/*`.
-   Triage the NextRequest vs Request helper mismatch and apply a fix.

End of note — open this file to pick up where we left off.
