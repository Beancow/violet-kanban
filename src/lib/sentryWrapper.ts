// Lightweight wrapper around @sentry/nextjs that allows disabling Sentry via env vars
// and provides safe no-op fallbacks for commonly used APIs.
// Usage: import * as sentry from '@/lib/sentryWrapper';

const CLIENT_DISABLED =
    typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_DISABLE_SENTRY === '1' ||
        process.env.NEXT_PUBLIC_DISABLE_SENTRY === 'true');
const SERVER_DISABLED =
    typeof process !== 'undefined' &&
    (process.env.DISABLE_SENTRY === '1' ||
        process.env.DISABLE_SENTRY === 'true');

type NextConfigLike = Record<string, unknown>;

type SentryLike = {
    init?: (opts?: unknown) => void;
    captureException?: (err: unknown) => void;
    captureMessage?: (msg: string, ...rest: unknown[]) => void;
    captureRequestError?: (...args: unknown[]) => void;
    captureRouterTransitionStart?: (
        href: string,
        navigationType: string
    ) => void;
    replayIntegration?: () => unknown;
    withSentryConfig?: (
        nextConfig: NextConfigLike,
        opts?: unknown
    ) => NextConfigLike | unknown;
};

let realSentry: SentryLike | null = null;
let attemptedLoad = false;

function loadSentryIfServer() {
    if (attemptedLoad) return;
    attemptedLoad = true;
    // Only attempt to require Sentry on the server and when not disabled
    if (typeof window === 'undefined' && !SERVER_DISABLED && !CLIENT_DISABLED) {
        try {
            // Use eval('require') to hide the static require from bundlers so
            // server-only dependencies (like opentelemetry inside @sentry/nextjs)
            // are not pulled into client bundles during dev.
             
             
            const req = eval('require');
             
            realSentry = req('@sentry/nextjs') as SentryLike;
        } catch (err) {
            // Failed to load server Sentry; keep realSentry null and log at debug level
             
            console.debug('[sentry] failed to load @sentry/nextjs', err);
            realSentry = null;
        }
    } else {
        realSentry = null;
    }
}

function noop(..._args: unknown[]) {}

export const init = (opts?: unknown) => {
    loadSentryIfServer();
    if (realSentry && typeof realSentry.init === 'function')
        return realSentry.init(opts);
    // no-op
};

export const captureException = (err: unknown) => {
    loadSentryIfServer();
    if (realSentry && typeof realSentry.captureException === 'function')
        return realSentry.captureException(err);
     
    console.debug('[sentry] captureException (disabled)', err);
};

export const captureMessage = (msg: string, ...rest: unknown[]) => {
    loadSentryIfServer();
    if (realSentry && typeof realSentry.captureMessage === 'function')
        return realSentry.captureMessage(msg, ...rest);
     
    console.debug('[sentry] captureMessage (disabled)', msg, ...rest);
};

export const captureRequestError = (...args: unknown[]) => {
    loadSentryIfServer();
    if (realSentry && typeof realSentry.captureRequestError === 'function')
        return realSentry.captureRequestError(...args);
    // no-op
};

export const captureRouterTransitionStart = (
    href: string,
    navigationType: string
) => {
    loadSentryIfServer();
    if (
        realSentry &&
        typeof realSentry.captureRouterTransitionStart === 'function'
    )
        return realSentry.captureRouterTransitionStart(href, navigationType);
    // no-op
};

// Expose replayIntegration factory where available (client only)
export const replayIntegration = () => {
    loadSentryIfServer();
    return realSentry && typeof realSentry.replayIntegration === 'function'
        ? realSentry.replayIntegration()
        : undefined;
};

// Re-export Sentry object for rare advanced usage when available.
export const Sentry: SentryLike = {
    init: noop,
    captureException: noop,
    captureMessage: noop,
    captureRequestError: noop,
    captureRouterTransitionStart: noop,
    replayIntegration: () => undefined,
    // nextjs webpack helper (stubbed when missing)
    withSentryConfig: (nextConfig: NextConfigLike, _opts?: unknown) =>
        nextConfig,
};

export const withSentryConfig = (
    nextConfig: NextConfigLike,
    opts?: unknown
) => {
    loadSentryIfServer();
    return realSentry && typeof realSentry.withSentryConfig === 'function'
        ? (realSentry.withSentryConfig(nextConfig, opts) as
              | NextConfigLike
              | undefined)
        : nextConfig;
};

export default Sentry;
