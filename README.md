This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

This project includes a couple of small runtime/type helpers to make store patch updates safer and clearer:

-   `src/types/utilityTypes.ts`

    -   `PartialWithRequiredId<T>`: a reusable alias for patch/update payloads that require an `id` but only include the fields to change.

-   `src/utils/patchHelpers.ts`
    -   `buildPatch<T>(input: Partial<T>, allowNullFor?: Array<keyof T>)`: builds a sanitized patch object by filtering out `undefined` values and (unless allowed) `null` values. This avoids accidental overwrites.

Recommended patterns:

-   For store update methods which are patch-oriented, use the `PartialWithRequiredId<T>` signature and merge the patch into the existing object. Example:

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

## Migration notes — stores moved into context providers

We recently changed how Zustand stores are created and consumed across the app:

-   Previously: stores were created as app-wide singletons in `src/store/*` and often imported directly by components.
-   Now: stores are created by factory functions and instantiated inside React context providers (see `src/providers/*`).

Why this change?

-   It makes store instances local to a provider, improving testability and allowing multiple isolated store instances (useful for testing or embedded widgets).
-   It centralizes lifecycle and persistence logic inside provider components and avoids accidental global state coupling.

Migration checklist

-   Wrap top-level app (or specific subtree) with the new providers instead of relying on global singletons. For example, add the appropriate providers in your app layout (already done in the project): use the provider components exported from `src/providers`.
-   Replace direct imports of store singletons with the provider-backed hooks. For example, instead of importing a singleton store from `src/store/boardStore`, import the hook provided by the provider (or use the exported selector hook from `src/store/useVioletKanbanHooks`) so the component reads the store instance from context.
-   Tests: create store instances via the factory and mount components with the corresponding provider wrappers (the providers accept a store factory in tests in order to inject a fresh instance per test).

Quick migration examples

-   Before (singleton import):

    // old: directly importing a module-level store
    import { useBoardStore } from '@/store/boardStore';

-   After (provider-backed):

    // new: consume the store that the provider created for this subtree
    import { useBoardStore } from '@/store/useVioletKanbanHooks';
    // ensure the component tree is wrapped by the provider from `src/providers`

Notes on related API changes

-   Enqueue / queue helpers: the queue APIs were simplified to accept domain objects. Use the new helpers exported from `src/store/useVioletKanbanHooks` (for example `useVioletKanbanEnqueueCardCreateOrUpdate`, `useVioletKanbanEnqueueListCreateOrUpdate`, `useVioletKanbanEnqueueBoardCreateOrUpdate`). These helpers will generate temporary ids automatically for creates (when the passed object's `id` is empty or a temp id) and will enqueue the proper create vs update action.
-   Forms: form wrappers now own `useForm` and act as smart containers; the presentational form components accept a `form` prop (a `UseFormReturn<>`) and an `onSubmit` handler. This keeps presentation components pure and moves validation/defaults into the wrapper. Example pattern:

    // wrapper (owns useForm and submit logic)
    const form = useForm({ resolver: zodResolver(Schema), defaultValues: {...} });
    const handleSubmit = (data) => { enqueueCreateOrUpdate(data); closeUi(); };
    return <MyForm form={form} onSubmit={handleSubmit} />;

    // presentation component (pure)
    export function MyForm({ form, onSubmit }) { const { register, handleSubmit } = form; return <form onSubmit={handleSubmit(onSubmit)}>...</form> }

Temp-id policy

-   Presentation-level code (forms/components) should not attempt to construct globally-unique temp ids. Use `data.id ?? 'temp-thing'` as a placeholder. The queue builder will create and persist proper temp ids and swap them when server sync returns the real id.
