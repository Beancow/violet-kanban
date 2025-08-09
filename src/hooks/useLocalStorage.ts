
import { useState, useEffect, useCallback } from 'react';

const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            if (typeof window === 'undefined') {
                console.warn(`Tried setting localStorage key “${key}” even though no window was found.`);
                return;
            }
            try {
                // Use the functional update form of useState's setter
                setStoredValue((prevValue) => {
                    const valueToStore = value instanceof Function ? value(prevValue) : value;
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                    // Dispatch a custom event to notify other instances of this hook
                    window.dispatchEvent(new CustomEvent('local-storage-changed', { detail: { key } }));
                    return valueToStore;
                });
            } catch (error) {
                console.error(`Error setting localStorage key “${key}”:`, error);
            }
        },
        [key] // No dependency on storedValue
    );

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const handleStorageChange = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail.key === key) {
                // Schedule the state update for the next event loop tick
                setTimeout(() => {
                    try {
                        const item = window.localStorage.getItem(key);
                        setStoredValue(item ? JSON.parse(item) : initialValue);
                    } catch (error) {
                        console.error(`Error handling custom storage event for key “${key}”:`, error);
                    }
                }, 0);
            }
        };

        window.addEventListener('local-storage-changed', handleStorageChange);

        return () => {
            window.removeEventListener('local-storage-changed', handleStorageChange);
        };
    }, [key, initialValue]);

    return [storedValue, setValue];
};

export default useLocalStorage;
