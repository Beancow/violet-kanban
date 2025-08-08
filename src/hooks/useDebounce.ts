import { useRef, useCallback } from 'react';

export function useDebounce(func: (...args: any[]) => any, delay: number) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedFunc = useCallback(
        (...args: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                func(...args);
            }, delay);
        },
        [func, delay]
    );

    return debouncedFunc;
}
