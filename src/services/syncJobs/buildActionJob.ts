import { isObject } from '@/types/typeGuards';
import type { VioletKanbanAction } from '@/types';

export default function buildActionToPost(
    a: VioletKanbanAction,
    freshToken?: string | null,
    orgId?: string | undefined
) {
    const base = isObject(a)
        ? (a as Record<string, unknown>)
        : ({} as Record<string, unknown>);
    const originalPayload = isObject((a as any).payload)
        ? ({ ...((a as any).payload as Record<string, unknown>) } as Record<
              string,
              unknown
          >)
        : ({} as Record<string, unknown>);
    const payload = {
        ...originalPayload,
        ...(freshToken ? { idToken: freshToken } : {}),
        ...(orgId ? { organizationId: orgId } : {}),
    } as Record<string, unknown>;
    return { ...base, payload };
}
