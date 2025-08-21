// Small collection of runtime type guards used across the stores/helpers.
export function isObject(v: unknown): v is Record<string, unknown> {
    return v !== null && typeof v === 'object';
}

export function hasDataProp(v: unknown): v is { data: unknown } {
    return isObject(v) && 'data' in v;
}

export function hasIdProp(v: unknown): v is { id: unknown } {
    return isObject(v) && 'id' in v;
}

export function hasTempIdProp(v: unknown): v is { tempId: unknown } {
    return isObject(v) && 'tempId' in v;
}

export function isStringId(v: unknown): v is string {
    return typeof v === 'string' && v.length > 0;
}

export function isBoardLike(v: unknown): v is import('../types/appState.type').Board {
    return isObject(v) && typeof (v as any).id === 'string';
}

export function isBoardListLike(v: unknown): v is import('../types/appState.type').BoardList {
    return isObject(v) && typeof (v as any).id === 'string';
}

export function isBoardCardLike(v: unknown): v is import('../types/appState.type').BoardCard {
    return isObject(v) && typeof (v as any).id === 'string';
}

export function isDateLike(v: unknown): v is Date {
    return (
        v instanceof Date ||
        (isObject(v) && typeof (v as any).getTime === 'function')
    );
}
