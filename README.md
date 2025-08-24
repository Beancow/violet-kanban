This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

<!-- Playwright manual cross-browser status badge -->

[![Playwright E2E](https://github.com/Beancow/violet-kanban/actions/workflows/playwright-schedule.yml/badge.svg?branch=main)](https://github.com/Beancow/violet-kanban/actions/workflows/playwright-schedule.yml)

<!-- Storybook deploy badge -->

[![Storybook](https://github.com/Beancow/violet-kanban/actions/workflows/deploy-storybook.yml/badge.svg?branch=main)](https://github.com/Beancow/violet-kanban/actions/workflows/deploy-storybook.yml)

## Getting Started

First, run the development server (npm is preferred):

```bash
npm run dev
```

If you use yarn, pnpm, or bun, their commands will work too but this README prefers npm.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Running tests

Run all tests with Jest:

```bash
npm test
```

Run only the smoke tests:

```bash
npm run test:smoke
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Developer notes

This project includes a couple of small runtime/type helpers to make state patch updates safer and clearer:

-   `src/types/utilityTypes.ts`

    -   `PartialWithRequiredId<T>`: a reusable alias for patch/update payloads that require an `id` but only include the fields to change.

-   `src/utils/patchHelpers.ts`
    -   `buildPatch<T>(input: Partial<T>, allowNullFor?: Array<keyof T>)`: builds a sanitized patch object by filtering out `undefined` values and (unless allowed) `null` values. This avoids accidental overwrites.

Recommended patterns:

    -   For update methods which are patch-oriented, use the `PartialWithRequiredId<T>` signature and merge the patch into the existing object. Example:
    ```ts
    updateCard: (card: PartialWithRequiredId<BoardCard>) => {
        const patch = buildPatch<BoardCard>(card);
        // merge patch into existing card by id
    };
    ```

-   When you intentionally need to set a field to `null` (for example, clearing `listId` when a list is removed), pass the allowed keys to `buildPatch`:

    ```ts
    const patch = buildPatch<BoardCard>({ listId: null }, ['listId']);
    ```

This keeps update code concise and avoids repeated `Object.entries` boilerplate.

## Local Sentry controls for development

When working on large rewrites you may want to avoid sending events to Sentry.
Create or use the repository root `.env.development` to control Sentry behavior locally.

-   `DISABLE_SENTRY=1` prevents server/edge Sentry initialization.
-   `NEXT_PUBLIC_DISABLE_SENTRY=1` prevents client-side Sentry initialization.

The project includes a `.env.development` that sets both flags to `1` by default so `npm run dev` won't initialize Sentry locally. To enable Sentry during local development, unset the flags or run the `dev:with-sentry` script instead.

## Migration notes — zustand stores replaced by context providers

We changed how the previous Zustand stores are created and consumed across the app; the app now uses provider-backed hooks.

-   Previously: the app used Zustand singletons (in `src/store/*`) and components imported those singletons directly.
-   Now: state is instantiated inside React context providers — see `src/providers/*`. Components should consume provider hooks (or the convenience hooks in `src/providers/useVioletKanbanHooks`).

Why this change?

-   It makes instances local to a provider, improving testability and allowing multiple isolated instances (useful for testing or embedded widgets).
-   It centralizes lifecycle and persistence inside provider components and avoids accidental global state coupling.

Migration checklist

-   Wrap the top-level app (or a specific subtree) with the new providers. Provider components are exported from `src/providers` and are already wired in the app layout.
-   Replace direct imports of previous singletons with the provider-backed hooks. Prefer the convenience hooks in `src/providers/useVioletKanbanHooks` where appropriate.
-   Tests: create reducer-backed instances via the exported reducers or use the provider wrappers in integration tests.

Quick migration examples

Before (singleton import):

    // old: directly importing a module-level store
    import { useBoardStore } from '@/store/boardStore';

After (provider-backed):

    // new: consume the API that the provider created for this subtree
    import { useBoards } from '@/providers/BoardProvider';
    // ensure the component tree is wrapped by the provider from `src/providers`

Notes on related API changes

-   Enqueue / queue helpers: use the helpers exported from `src/providers/useVioletKanbanHooks` (for example `useVioletKanbanEnqueueCardCreateOrUpdate`, `useVioletKanbanEnqueueListCreateOrUpdate`, `useVioletKanbanEnqueueBoardCreateOrUpdate`). These helpers generate temporary ids for creates and enqueue the proper create vs update action.
-   Forms: form wrappers now own `useForm` and act as smart containers; the presentational form components accept a `form` prop (a `UseFormReturn<>`) and an `onSubmit` handler. This keeps presentation components pure and moves validation/defaults into the wrapper. Example pattern:

    // wrapper (owns useForm and submit logic)
    const form = useForm({ resolver: zodResolver(Schema), defaultValues: {...} });
    const handleSubmit = (data) => { enqueueCreateOrUpdate(data); closeUi(); };
    return <MyForm form={form} onSubmit={handleSubmit} />;

    // presentation component (pure)
    export function MyForm({ form, onSubmit }) { const { register, handleSubmit } = form; return <form onSubmit={handleSubmit(onSubmit)}>...</form> }

Temp-id policy

-   Presentation-level code (forms/components) should not attempt to construct globally-unique temp ids. Use `data.id ?? 'temp-thing'` as a placeholder. The queue builder will create and persist proper temp ids and swap them when server sync returns the real id.
