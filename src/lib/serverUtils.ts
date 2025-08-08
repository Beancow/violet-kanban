import { getAdminAuth } from './firebase/firebase-admin-init';
import { NextRequest } from 'next/server';

export async function getAuthAndOrgContext(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const orgId = request.headers.get('x-organization-id'); // Custom header for orgId

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Authorization header missing or malformed');
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!orgId) {
        throw new Error('X-Organization-Id header missing');
    }

    try {
        const adminAuth = await getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        return { uid, orgId };
    } catch (error) {
        console.error('Error verifying ID token:', error);
        throw new Error('Invalid or expired authentication token');
    }
}
