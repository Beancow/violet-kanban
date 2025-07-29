'use server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseGetFirestore } from './firebase-config';
import { User } from '@/types/appState.type';
import * as sentry from '@sentry/nextjs';
import { dataConverter } from './dataConverter';

const db = firebaseGetFirestore();

export async function getUserAction(uid: string) {
    const userCollection = doc(db, `users/${uid}`).withConverter(
        dataConverter<User>()
    );
    const userDoc = await getDoc(userCollection);

    if (!userDoc.exists()) {
        console.warn('User document does not exist:', uid);
        return {
            success: false,
            data: null,
            error: new Error(`User with UID ${uid} does not exist`),
        };
    }

    sentry.captureMessage('Fetching user document:' + ` ${userDoc.id}`, {
        level: 'info',
    });

    const userData = { ...userDoc.data() };

    if (!userData) {
        console.warn('User data is null or undefined:', uid);
        return {
            success: false,
            data: null,
            error: new Error(`User data for UID ${uid} is null or undefined`),
        };
    }

    try {
        return {
            success: true,
            data: userData as User,
        };
    } catch (error) {
        console.error('Error fetching user:', error);
        return {
            success: false,
            data: null,
            error: new Error('Failed to fetch user', { cause: error }),
        };
    }
}

export async function storeUserDataForUidAction(
    uid: string,
    user: User | null
) {
    const userDocRef = doc(db, `users/${uid}`).withConverter(
        dataConverter<User>()
    );

    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            console.warn('User document already exists:', uid);
            return {
                success: false,
                error: new Error(`User with UID ${uid} already exists`),
            };
        }
        await setDoc(userDocRef, user);
        console.log('User document stored successfully:', uid);
        sentry.captureMessage('Storing user document:' + ` ${userDocRef.id}`, {
            level: 'info',
        });
        return { success: true };
    } catch (error) {
        console.error('Error storing user:', error);
        sentry.captureException(error);
        return {
            success: false,
            error: new Error('Failed to store user', { cause: error }),
        };
    }
}
