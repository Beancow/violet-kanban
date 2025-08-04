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
