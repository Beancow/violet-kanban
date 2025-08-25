// Minimal helpers for Firebase-related client utilities
import { captureException } from '@/lib/sentryWrapper';

/**
 * Decode base64url string to JSON string in the browser only.
 * This helper intentionally throws when called in a non-browser environment.
 */
function base64UrlDecode(input: string): string {
    const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof atob !== 'function') {
        throw new Error(
            'base64UrlDecode: client-only helper; atob is not available in this environment'
        );
    }
    return decodeURIComponent(
        atob(b64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
}

/**
 * Extract the expiry (exp) claim from a JWT and return it as milliseconds
 * since epoch. This is a client-only helper and must not be called on the
 * server or in Node.js runtime.
 *
 * Returns null when the token is missing or cannot be parsed.
 */
export function getTokenExpiryMs(token: string | null): number | null {
    if (typeof window === 'undefined') {
        // Fail fast to avoid accidental server use
        throw new Error(
            'getTokenExpiryMs is a client-only helper and must not be called in Node/server environments'
        );
    }
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payload = parts[1];
        const json = base64UrlDecode(payload);
        const obj = JSON.parse(json) as { exp?: number };
        if (!obj || typeof obj.exp !== 'number') return null;
        return obj.exp * 1000;
    } catch (e) {
        // Report parsing errors for diagnostics, but return null to keep callers robust
        try {
            captureException(e);
        } catch (sentryErr) {
            console.error('[sentry] captureException failed', sentryErr);
        }
        console.error('[firebaseHelpers] failed to parse token expiry', e);
        return null;
    }
}
