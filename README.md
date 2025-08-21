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
