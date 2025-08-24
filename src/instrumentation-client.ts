// This file configures lazy initialization of Sentry on the client.
// We avoid a static import to keep client bundles free from server-only
// Sentry transitive deps when possible.

// Allow disabling Sentry on client with NEXT_PUBLIC_DISABLE_SENTRY.
const CLIENT_DISABLED =
    typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_DISABLE_SENTRY === '1' ||
        process.env.NEXT_PUBLIC_DISABLE_SENTRY === 'true');

async function initClientSentryIfNeeded() {
    if (CLIENT_DISABLED) return;
    try {
        const Sentry = await import('@/lib/sentryWrapper');
        Sentry.init({
            dsn: 'https://3efb49fd9eb7999b53d059e27def7f16@o4509742391427072.ingest.de.sentry.io/4509742392606800',
            integrations: [
                Sentry.replayIntegration && Sentry.replayIntegration(),
            ],
            tracesSampleRate: 1,
            enableLogs: true,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            debug: false,
        });
    } catch (e) {
        // Log import/init errors for diagnostics; don't throw from client code.
        console.error('[sentry] failed to initialize client Sentry', e);
        try {
            // If the wrapper is available, attempt to report the initialization error
            const Sentry = await import('@/lib/sentryWrapper');
            Sentry.captureException(e);
        } catch {
            /* ignore */
        }
    }
}

// Initialize lazily (do not block module evaluation)
void initClientSentryIfNeeded();

// Export a router transition handler that will call into the lazy-loaded
// Sentry instance if available. Consumers should call this as a function.
export const onRouterTransitionStart = async (
    href: string,
    navigationType: string
) => {
    try {
        const Sentry = await import('@/lib/sentryWrapper');
        return Sentry.captureRouterTransitionStart?.(href, navigationType);
    } catch (e) {
        console.error(
            '[sentry] failed to call captureRouterTransitionStart',
            e
        );
        return undefined;
    }
};
