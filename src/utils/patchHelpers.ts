// Helper to build a sanitized patch object from a Partial<T>.
// By default this will exclude keys with value `undefined` or `null`.
// Pass `allowNullFor` to permit explicit `null` for specific keys.
export function buildPatch<T extends Record<string, unknown>>(
    input: Partial<T>,
    allowNullFor: Array<keyof T> = []
): Partial<T> {
    const patch: Partial<T> = {};
    Object.entries(input).forEach(([k, v]) => {
        if (k === 'id') return; // skip id in patches
        if (v === undefined) return;
        if (v === null && !(allowNullFor as string[]).includes(k)) return;
        patch[k as keyof T] = v as T[keyof T];
    });
    return patch;
}
