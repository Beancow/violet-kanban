'use server';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firebaseDB } from '@/lib/firebase/firebase-config';
import { User } from '@/types/appState.type';
import { adminDataConverter } from './adminDataConverter';

// Dynamic import for firebase-admin-init
const getAdminFirestore = async () => {
    const { getAdminFirestore } = await import('./firebase-admin-init');
    return getAdminFirestore();
};

export async function getUserServerAction(userId: string): Promise<{ success: boolean; data?: User; error?: Error }> {
    try {
        const adminFirestore = await getAdminFirestore();
        const userRef = adminFirestore.doc(`users/${userId}`).withConverter(adminDataConverter<User>());
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { success: true, data: userSnap.data() as User };
        } else {
            return { success: false, error: new Error('User not found') };
        }
    } catch (error) {
        console.error('Error in getUserServerAction:', error);
        return {
            success: false,
            error: new Error('Failed to fetch user', { cause: error }),
        };
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
        return {
            success: false,
            error: new Error('Failed to create user', { cause: error }),
        };
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