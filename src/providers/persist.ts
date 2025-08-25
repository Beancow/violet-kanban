import { useEffect, useRef } from 'react';
import * as Sentry from '@/lib/sentryWrapper';
import { safeCaptureException } from '@/lib/sentryWrapper';

export function useHydrateFromStorage<T>(key: string, initial: T) {
    // returns hydrated initial state synchronously (from localStorage) and
    // provides an effect to write changes.
    let hydrated = initial;
    try {
        if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem(key);
            if (raw) {
                hydrated = JSON.parse(raw) as T;
            }
        }
    } catch (e) {
        // Log parse/read errors when hydrating from localStorage.
        console.error('[persist] failed to read from localStorage', e);
        // Report to Sentry when available for server-side diagnostics.
        safeCaptureException(e);
    }
    const last = useRef<T>(hydrated);
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(last.current));
        } catch (e) {
            // Log write errors for diagnostics (e.g., storage quota exceeded)
            console.error('[persist] failed to write to localStorage', e);
            safeCaptureException(e);
        }
    }, [key]);
    return {
        hydrated,
        setLast: (v: T) => (last.current = v),
    };
}
