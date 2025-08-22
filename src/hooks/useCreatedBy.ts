// takes in an object that might contain a createdBy field and returns a normalized createdBy object

import { useAuthProvider } from '@/providers/AuthProvider';

// uses the current user context to fill in any missing fields
export function useCreatedBy<T>(
    item?: T & {
        createdBy?: { userId?: string; name?: string; email?: string };
    }
): { userId: string; name: string; email: string } {
    const user = useAuthProvider().authUser;
    return {
        userId: item?.createdBy?.userId ?? user?.id ?? '',
        name: item?.createdBy?.name ?? user?.displayName ?? '',
        email: item?.createdBy?.email ?? user?.email ?? '',
    };
}
