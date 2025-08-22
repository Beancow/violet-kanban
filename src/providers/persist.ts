import { useEffect, useRef } from 'react';

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
        // ignore
    }
    const last = useRef<T>(hydrated);
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(last.current));
        } catch (e) {
            // noop
        }
    }, [key]);
    return {
        hydrated,
        setLast: (v: T) => (last.current = v),
    };
}
