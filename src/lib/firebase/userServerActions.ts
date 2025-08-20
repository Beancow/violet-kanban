'use server';
import { User } from '@/types/appState.type';
import { adminDataConverter } from './adminDataConverter';
import { getAdminAuth, getAdminFirestore } from './firebase-admin-init';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';

export async function getUserServerAction(
    userId: string
): Promise<{ success: boolean; data?: User; error?: Error }> {
    try {
        // Validate userId
        if (
            !userId ||
            typeof userId !== 'string' ||
            userId.length === 0 ||
            userId.length > 128
        ) {
            throw new Error(
                'Invalid userId: must be a non-empty string with at most 128 characters.'
            );
        }

        const adminFirestore = await getAdminFirestore();
        const userRef = adminFirestore
            .doc(`users/${userId}`)
            .withConverter(adminDataConverter<User>());
        const userSnap = await userRef.get();

        if (userSnap.exists) {
            return { success: true, data: userSnap.data() };
        } else {
            // User not found, create it
            const userRecord = await getAdminAuth();
            const { uid, email, displayName, photoURL } =
                await userRecord.getUser(userId);

            const newUser: User = {
                id: uid,
                email: email ?? '',
                displayName: displayName ?? '',
                photoURL: photoURL ?? '',
                name: displayName ?? '',
                createdAt: FieldValue.serverTimestamp().toString(),
                updatedAt: FieldValue.serverTimestamp().toString(),
            };
            await userRef.set(newUser);
            return { success: true, data: newUser };
        }
    } catch (error) {
        console.error('Error in getUserServerAction:', error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An unknown error occurred';
        return {
            success: false,
            error: new Error(errorMessage),
        };
    }
}

export async function updateUser(data: FormData, uid: string) {
    const adminFirestore = await getAdminFirestore();
    const userDoc = adminFirestore.doc(`users/${uid}`);

    const userData = {
        username: data.get('username')?.valueOf(),
        email: data.get('email')?.valueOf(),
        displayName: data.get('displayName')?.valueOf(),
    };

    if (!userData.username || !userData.email || !userData.displayName) {
        throw new Error('Invalid user data');
    }

    await userDoc.update(userData);

    return {
        success: true,
        data: userData,
    };
}
