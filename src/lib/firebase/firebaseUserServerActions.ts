import { firebaseDB } from '@/lib/firebase/firebase-config';
import { User } from '@/types/appState.type';
import { doc, setDoc } from 'firebase/firestore';
import * as sentry from '@sentry/nextjs';

export async function createUserAction(user: User) {
    const userRef = doc(firebaseDB, 'users', user.id);

    try {
        await setDoc(userRef, user);
        return {
            success: true,
            data: { message: 'User created successfully' },
        };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error creating user:', error);
        return {
            success: false,
            error: new Error('Failed to create user', { cause: error }),
        };
    }
}
