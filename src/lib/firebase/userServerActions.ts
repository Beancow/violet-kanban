import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseDB } from '@/lib/firebase/firebase-config';
import { User } from '@/types/appState.type';

export async function getUser(userId: string): Promise<{ success: boolean; data?: User; error?: any }> {
    try {
        const userRef = doc(firebaseDB, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { success: true, data: userSnap.data() as User };
        } else {
            return { success: false, error: { message: 'User not found' } };
        }
    } catch (error) {
        console.error("Error in getUser:", error);
        return { success: false, error };
    }
}

export async function createUser(user: User): Promise<{ success: boolean; error?: any }> {
    try {
        const userRef = doc(firebaseDB, 'users', user.id);
        await setDoc(userRef, user);
        return { success: true };
    } catch (error) {
        console.error("Error in createUser:", error);
        return { success: false, error };
    }
}

export async function setDefaultOrganizationAction(userId: string, orgId: string): Promise<{ success: boolean; error?: any }> {
    try {
        const userRef = doc(firebaseDB, 'users', userId);
        await setDoc(userRef, { currentOrganizationId: orgId }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error("Error in setDefaultOrganizationAction:", error);
        return { success: false, error };
    }
}
