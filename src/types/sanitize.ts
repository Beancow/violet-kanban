// Generic sanitizer/guard types for helpers that operate over multiple shapes
export type Guard<T> = (v: unknown) => v is T;

export type Sanitizer<T> = (
    items: unknown[] | undefined,
    guard: Guard<T>
) => T[];

// Example: export a small contract for a sanitizeArray helper
export type SanitizeArrayFn = <T>(
    items: unknown[] | undefined,
    guard: Guard<T>
) => T[];

export default {} as const;
