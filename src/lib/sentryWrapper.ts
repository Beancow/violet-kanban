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
    const safe = sanitizeForSentry(err);
    if (realSentry && typeof realSentry.captureException === 'function')
        return realSentry.captureException(safe);

    console.debug('[sentry] captureException (disabled)', safe);
};

export const captureMessage = (msg: string, ...rest: unknown[]) => {
    loadSentryIfServer();
    if (realSentry && typeof realSentry.captureMessage === 'function')
        return realSentry.captureMessage(msg, ...rest);

    console.debug('[sentry] captureMessage (disabled)', msg, ...rest);
};

// Safe wrapper that attempts to capture an exception and falls back to
// console.error if the underlying capture throws for any reason.
export const safeCaptureException = (err: unknown) => {
    try {
        captureException(err);
    } catch (sentryErr) {
        // sanitize before logging to avoid leaking tokens to console
        const safeOriginal = sanitizeForSentry(err);
        const safeSentryErr = sanitizeForSentry(sentryErr);
        console.error(
            '[sentry] safeCaptureException failed',
            safeSentryErr,
            'original:',
            safeOriginal
        );
    }
};

// ---- Sanitization utilities -------------------------------------------------
// Redact common sensitive keys and token-like strings before sending to Sentry
const SENSITIVE_KEYS = new Set([
    'token',
    'idToken',
    'accessToken',
    'refreshToken',
    'authorization',
    'auth',
    'password',
    'secret',
    'credentials',
    'ssn',
]);

function isJwtLike(value: string) {
    // very small heuristic for JWT-like strings: three dot-separated base64url parts
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}

function redactTokenInString(s: string) {
    // redact JWTs
    if (isJwtLike(s)) return '[REDACTED_TOKEN]';

    // redact common query param tokens like ?token=... or &access_token=...
    return s
        .replace(
            /([?&](?:token|access_token|id_token|refresh_token|auth)=)[^&\s]+/gi,
            '$1[REDACTED]'
        )
        .replace(/(authorization:\s*Bearer\s+)[^\s]+/i, '$1[REDACTED]');
}

function sanitizeForSentry(value: unknown, maxDepth = 5): unknown {
    const seen = new WeakSet();

    function _sanitize(v: unknown, depth: number): unknown {
        if (v == null) return v;
        if (typeof v === 'string') return redactTokenInString(v);
        if (
            typeof v === 'number' ||
            typeof v === 'boolean' ||
            typeof v === 'function'
        )
            return v;
        if (depth <= 0) return '[REDACTED]';

        if (typeof v === 'object') {
            // avoid circular traversal
            try {
                if (seen.has(v as object)) return '[CIRCULAR]';
                seen.add(v as object);
            } catch {
                // WeakSet can throw for primitives, ignore
            }

            if (Array.isArray(v)) {
                return v.map((item) => _sanitize(item, depth - 1));
            }

            const out: Record<string, unknown> = {};
            for (const [k, val] of Object.entries(
                v as Record<string, unknown>
            )) {
                try {
                    if (SENSITIVE_KEYS.has(k)) {
                        out[k] = '[REDACTED]';
                        continue;
                    }
                    // sanitize key-containing values as well
                    if (typeof val === 'string') {
                        out[k] = redactTokenInString(val);
                    } else {
                        out[k] = _sanitize(val, depth - 1);
                    }
                } catch {
                    out[k] = '[REDACTED]';
                }
            }
            return out;
        }

        // fallback
        return '[REDACTED]';
    }

    return _sanitize(value, maxDepth);
}

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
