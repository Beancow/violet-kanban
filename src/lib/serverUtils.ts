import { getAdminAuth } from './firebase/firebase-admin-init';
import { NextRequest } from 'next/server';

/**
 * Extracts the UID from the Authorization header.
 * Use this for operations that only require user authentication without a specific organization context.
 * @param request The NextRequest object.
 * @returns The user's UID.
 */
export async function getUidFromAuthHeader(request: NextRequest): Promise<string> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Authorization header missing or malformed');
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const adminAuth = await getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        return decodedToken.uid;
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
    const uid = await getUidFromAuthHeader(request);
    const orgId = request.headers.get('x-organization-id');

    if (!orgId) {
        throw new Error('X-Organization-Id header missing');
    }

    return { uid, orgId };
}