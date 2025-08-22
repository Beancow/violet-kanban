import { User } from '@/types/appState.type';
import { getAdminAuth } from './firebase/firebase-admin-init';
import { NextRequest } from 'next/server';

/**
 * Extracts the UID from the Authorization header.
 * Use this for operations that only require user authentication without a specific organization context.
 * @param request The NextRequest object.
 * @returns The user's UID.
 */
export async function getUserFromAuthHeader(
    request: NextRequest
): Promise<User> {
    const authHeader =
        request.headers.get('authorization') ||
        request.headers.get('Authorization');
    console.log('Authorization header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Authorization header missing or malformed');
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const adminAuth = await getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const user: User = {
            id: decodedToken.uid,
            email: decodedToken?.email ?? '',
            name: decodedToken?.name ?? '',
            displayName: decodedToken?.displayName ?? '',
        };
        return user;
    } catch (error) {
        console.error('Error verifying ID token:', error);
        throw new Error('Invalid or expired authentication token');
    }
}

/**
 * Extracts both UID and Organization ID from the request headers.
 * Use this for operations that require the user to be acting within a specific organization.
 * @param request The NextRequest object.
 * @returns An object containing the uid and orgId.
 */
export async function getAuthAndOrgContext(request: NextRequest) {
    const user = await getUserFromAuthHeader(request);
    const orgId = request.headers.get('x-organization-id');

    if (!orgId) {
        throw new Error('X-Organization-Id header missing');
    }

    return { user, orgId };
}
