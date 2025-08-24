'use client';

import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
    error,
}: {
    error: Error & { digest?: string };
}) {
    useEffect(() => {
        // Lazy-load the Sentry wrapper only when an error actually occurs in
        // the client. This prevents bundlers from including the wrapper at
        // module-eval time and keeps client bundles smaller.
        (async () => {
            try {
                const Sentry = await import('@/lib/sentryWrapper');
                Sentry.captureException?.(error);
            } catch (err) {
                // If the dynamic import or Sentry init fails, log it for debugging.
                // We don't want the error handling itself to crash the app.
                console.error(
                    '[sentry] failed to lazy-load client Sentry',
                    err
                );
            }
        })();
    }, [error]);

    return (
        <html>
            <body>
                {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
                <NextError statusCode={0} />
            </body>
        </html>
    );
}
