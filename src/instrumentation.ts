import * as Sentry from '@/lib/sentryWrapper';

const DISABLED =
    process.env.DISABLE_SENTRY === '1' || process.env.DISABLE_SENTRY === 'true';

export async function register() {
    if (DISABLED) {
        // No-op register when disabled
        // eslint-disable-next-line no-console
        console.log('[sentry] register skipped because DISABLE_SENTRY is set');
        return;
    }

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('../sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('../sentry.edge.config');
    }
}

// Export a safe handler; when Sentry is disabled export a no-op.
export const onRequestError = DISABLED
    ? (..._args: any[]) => {}
    : Sentry.captureRequestError;
