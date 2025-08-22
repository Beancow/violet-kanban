// Lightweight wrapper around @sentry/nextjs that allows disabling Sentry via env vars
// and provides safe no-op fallbacks for commonly used APIs.
// Usage: import * as sentry from '@/lib/sentryWrapper';

const CLIENT_DISABLED =
    typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_DISABLE_SENTRY === '1' ||
        process.env.NEXT_PUBLIC_DISABLE_SENTRY === 'true');
const SERVER_DISABLED =
    process.env.DISABLE_SENTRY === '1' || process.env.DISABLE_SENTRY === 'true';

let realSentry: typeof import('@sentry/nextjs') | null = null;
try {
    // Only import when not disabled to reduce bundling/side-effects
    if (!CLIENT_DISABLED && !SERVER_DISABLED) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        realSentry = require('@sentry/nextjs');
    }
} catch (e) {
    // If the package is missing, fall back to no-op behavior.
    realSentry = null;
}

function noop(..._args: any[]) {}

export const init = (opts?: any) => {
    if (realSentry && typeof realSentry.init === 'function')
        return realSentry.init(opts);
    // no-op
};

export const captureException = (err: unknown) => {
    if (realSentry && typeof realSentry.captureException === 'function')
        return realSentry.captureException(err);
    // eslint-disable-next-line no-console
    console.debug('[sentry] captureException (disabled)', err);
};

export const captureMessage = (msg: string, ...rest: any[]) => {
    if (realSentry && typeof realSentry.captureMessage === 'function')
        return realSentry.captureMessage(msg, ...rest);
    // eslint-disable-next-line no-console
    console.debug('[sentry] captureMessage (disabled)', msg, ...rest);
};

export const captureRequestError = (...args: any[]) => {
    if (realSentry && typeof realSentry.captureRequestError === 'function')
        return (realSentry.captureRequestError as any)(...args);
    // no-op
};

export const captureRouterTransitionStart = (
    href: string,
    navigationType: string
) => {
    if (
        realSentry &&
        typeof realSentry.captureRouterTransitionStart === 'function'
    )
        return realSentry.captureRouterTransitionStart(href, navigationType);
    // no-op
};

// Expose replayIntegration factory where available (client only)
export const replayIntegration = () =>
    realSentry && (realSentry as any).replayIntegration
        ? (realSentry as any).replayIntegration()
        : undefined;

// Re-export Sentry object for rare advanced usage when available.
export const Sentry = realSentry ?? {
    init: noop,
    captureException: noop,
    captureMessage: noop,
    captureRequestError: noop,
    captureRouterTransitionStart: noop,
    replayIntegration: () => undefined,
    // nextjs webpack helper (stubbed when missing)
    withSentryConfig: (nextConfig: any, _opts?: any) => nextConfig,
};

export const withSentryConfig = (nextConfig: any, opts?: any) =>
    realSentry && (realSentry as any).withSentryConfig
        ? (realSentry as any).withSentryConfig(nextConfig, opts)
        : nextConfig;

export default Sentry;
