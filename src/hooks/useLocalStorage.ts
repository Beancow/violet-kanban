import { useCallback, useEffect, useState } from 'react';
import { safeCaptureException } from '@/lib/sentryWrapper';

// Client-only hook for typed localStorage access.
// Safely no-ops during SSR and provides a stable API for components/guards.
export function useLocalStorage<T>(key: string, initialValue: T | null = null) {
    const isClient =
        typeof window !== 'undefined' &&
        typeof window.localStorage !== 'undefined';

    const readValue = useCallback((): T | null => {
        if (!isClient) return initialValue;
        try {
            const raw = window.localStorage.getItem(key);
            if (raw === null) return initialValue;
            return JSON.parse(raw) as T;
        } catch (err) {
            // If parsing fails, return initial value. Surface in dev and capture for diagnostics.
            try {
                safeCaptureException(err as Error);
            } catch (_) {}
            if (process.env.NODE_ENV !== 'production')
                console.debug('[useLocalStorage] readValue failed', err);
            return initialValue;
        }
    }, [key, initialValue, isClient]);

    const [storedValue, setStoredValue] = useState<T | null>(readValue);

    useEffect(() => {
        setStoredValue(readValue());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const setValue = useCallback(
        (value: T | null | ((prev: T | null) => T | null)) => {
            if (!isClient) return;
            try {
                const nextValue =
                    typeof value === 'function'
                        ? (value as (prev: T | null) => T | null)(readValue())
                        : value;
                if (nextValue === null) {
                    window.localStorage.removeItem(key);
                } else {
                    window.localStorage.setItem(key, JSON.stringify(nextValue));
                }
                setStoredValue(nextValue);
            } catch (err) {
                // ignore write errors but surface in dev and capture unexpected issues
                try {
                    safeCaptureException(err as Error);
                } catch (_) {}
                if (process.env.NODE_ENV !== 'production')
                    console.debug('[useLocalStorage] setValue failed', err);
            }
        },
        [key, readValue, isClient]
    );

    return [storedValue, setValue] as const;
}

export default useLocalStorage;
