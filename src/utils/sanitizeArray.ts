import type { Guard, SanitizeArrayFn } from '@/types/sanitize';
import { isObject } from '@/types/typeGuards';

// Small generic sanitizer helper: returns only items that match the guard.
export const sanitizeArray: SanitizeArrayFn = function <T>(
    items: unknown[] | undefined,
    guard: Guard<T>
) {
    if (!items || items.length === 0) return [];
    const out: T[] = [];
    for (const it of items) {
        try {
            if (guard(it)) out.push(it as T);
        } catch (e) {
            // ignore
        }
    }
    return out;
};

export default sanitizeArray;
