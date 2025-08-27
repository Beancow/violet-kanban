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

export function hasTempId(v: unknown): v is { tempId: string } {
    return (
        isObject(v) && typeof (v as Record<string, unknown>).tempId === 'string'
    );
}

export function hasOrganizationIdInData(
    v: unknown
): v is { data: { organizationId: string } } {
    return (
        isObject(v) &&
        'data' in v &&
        isObject((v as Record<string, unknown>).data) &&
        typeof ((v as Record<string, unknown>).data as Record<string, unknown>)
            .organizationId === 'string'
    );
}

export function hasBoardProp(v: unknown): v is { board: unknown } {
    return isObject(v) && 'board' in v;
}

export function hasListProp(v: unknown): v is { list: unknown } {
    return isObject(v) && 'list' in v;
}

export function hasCardProp(v: unknown): v is { card: unknown } {
    return isObject(v) && 'card' in v;
}

export function hasTimestampProp(v: unknown): v is { timestamp: number } {
    return (
        isObject(v) &&
        typeof (v as Record<string, unknown>).timestamp === 'number'
    );
}

export function hasTypeProp(v: unknown): v is { type: string } {
    return (
        isObject(v) && typeof (v as Record<string, unknown>).type === 'string'
    );
}

export function hasCompanyNameProp(v: unknown): v is { companyName: string } {
    return (
        isObject(v) &&
        typeof (v as Record<string, unknown>).companyName === 'string'
    );
}

export function hasCompanyWebsiteProp(
    v: unknown
): v is { companyWebsite: string } {
    return (
        isObject(v) &&
        typeof (v as Record<string, unknown>).companyWebsite === 'string'
    );
}

export function hasLogoURLProp(v: unknown): v is { logoURL: string } {
    return (
        isObject(v) &&
        typeof (v as Record<string, unknown>).logoURL === 'string'
    );
}

export function isActionLike(
    v: unknown
): v is { type: string; payload?: unknown } {
    // Generic guard for objects that look like a domain action: must have a string `type`.
    return (
        isObject(v) && typeof (v as Record<string, unknown>).type === 'string'
    );
}

// (extractActionLikeId removed) use provider-level dedupe instead

export function isStringId(v: unknown): v is string {
    return typeof v === 'string' && v.length > 0;
}

export function isBoardLike(
    v: unknown
): v is import('../types/appState.type').Board {
    return isObject(v) && typeof (v as Record<string, unknown>).id === 'string';
}

export function isBoardListLike(
    v: unknown
): v is import('../types/appState.type').BoardList {
    return isObject(v) && typeof (v as Record<string, unknown>).id === 'string';
}

export function isBoardCardLike(
    v: unknown
): v is import('../types/appState.type').BoardCard {
    return isObject(v) && typeof (v as Record<string, unknown>).id === 'string';
}

export function isDateLike(v: unknown): v is Date {
    return (
        v instanceof Date ||
        (isObject(v) &&
            typeof (v as Record<string, unknown>).getTime === 'function')
    );
}

export function hasBoardId(v: unknown): v is { boardId: string } {
    return (
        isObject(v) &&
        typeof (v as Record<string, unknown>).boardId === 'string'
    );
}

export function hasListId(v: unknown): v is { listId: string } {
    return (
        isObject(v) && typeof (v as Record<string, unknown>).listId === 'string'
    );
}

export function hasUserId(v: unknown): v is { userId: string } {
    return (
        isObject(v) && typeof (v as Record<string, unknown>).userId === 'string'
    );
}
