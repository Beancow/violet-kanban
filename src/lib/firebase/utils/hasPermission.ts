import { firebaseDB, firebaseAuth } from '@/lib/firebase/firebase-config';
import { doc, getDoc } from 'firebase/firestore';

export async function hasPermission(
    orgId: string,
    requiredRole: 'owner' | 'admin' | 'member'
) {
    const user = firebaseAuth.currentUser;
    if (!user) {
        return false;
    }

    const orgRef = doc(firebaseDB, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);

    if (!orgDoc.exists()) {
        return false;
    }

    const orgData = orgDoc.data();
    const userRole = orgData.members[user.uid]?.role;

    if (!userRole) {
        return false;
    }

    const roles = ['owner', 'admin', 'member'];
    const requiredRoleIndex = roles.indexOf(requiredRole);
    const userRoleIndex = roles.indexOf(userRole);

    return userRoleIndex <= requiredRoleIndex;
}

async function checkPermissionInDatabase(
    uid: string,
    resource: string
): Promise<boolean> {
    const orgDoc = doc(firebaseDB, `organizations/${resource}`);
    const orgSnapshot = await getDoc(orgDoc);

    if (!orgSnapshot.exists()) {
        return false;
    }

    const orgData = orgSnapshot.data();
    const members: string[] = orgData.members || [];
    return members.includes(uid);
}

export async function checkUserPermission(params: {
    uid: string;
    resource: string;
}) {
    const { uid, resource } = params;
    const user = firebaseAuth.currentUser;

    if (!user) {
        return {
            success: false,
            message: 'User is not authenticated',
        };
    }

    // Check if the user has permission to access the resource
    const hasPermission = await checkPermissionInDatabase(uid, resource);
    if (!hasPermission) {
        return {
            success: false,
            message: 'User does not have permission to access this resource',
        };
    }

    return {
        success: true,
    };
}

export async function checkAuthentication() {
    const user = firebaseAuth.currentUser;
    if (!user) {
        return {
            success: false,
            message: 'User is not authenticated',
        };
    }

    return {
        success: true,
    };
}