import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firebaseDB } from '@/lib/firebase/firebase-config';
import { User } from '@/types/appState.type';

export async function getUserFromFirebaseDB(
    userId: string
): Promise<{ success: boolean; data?: User; error?: { message: string } }> {
    try {
        const userRef = doc(firebaseDB, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { success: true, data: userSnap.data() as User };
        } else {
            return { success: false, error: { message: 'User not found' } };
        }
    } catch (error) {
        console.error('Error in getUser:', error);
        return { success: false, error };
    }
}

export async function createUser(
    user: User
): Promise<{ success: boolean; error?: Error }> {
    try {
        const userRef = doc(firebaseDB, 'users', user.id);
        await setDoc(userRef, user);
        return { success: true };
    } catch (error) {
        console.error('Error in createUser:', error);
        return { success: false, error };
    }
}

export async function setDefaultOrganizationAction(
    userId: string,
    orgId?: string
): Promise<{ success: boolean; error?: Error }> {
    try {
        const userRef = doc(firebaseDB, 'users', userId);
        await setDoc(
            userRef,
            { currentOrganizationId: orgId },
            { merge: true }
        );
        return { success: true };
    } catch (error) {
        console.error('Error in setDefaultOrganizationAction:', error);
        return { success: false, error };
    }
}

export async function updateUser(data: FormData, uid: string) {
    const userDoc = doc(firebaseDB, `users/${uid}`);

    const userData = {
        username: data.get('username')?.valueOf(),
        email: data.get('email')?.valueOf(),
        displayName: data.get('displayName')?.valueOf(),
    };

    if (!userData.username || !userData.email || !userData.displayName) {
        throw new Error('Invalid user data');
    }

    await updateDoc(userDoc, userData);

    return {
        success: true,
        data: userData,
    };
}
