'use server';
import { revalidatePath } from 'next/cache';
import * as admin from 'firebase-admin';
import {
    Organization,
    CreateOrganizationResult,
    AddMemberToOrganizationResult,
    User,
} from '@/types/appState.type';

import { adminDataConverter } from './adminDataConverter';
import * as sentry from '@/lib/sentryWrapper';

// Dynamic import for firebase-admin-init
const getAdminFirestore = async () => {
    const { getAdminFirestore } = await import('./firebase-admin-init');
    return getAdminFirestore();
};

export async function getOrganizationServerAction(orgId: string, _uid: string) {
    console.log(`Attempting to fetch organization: ${orgId}`);
    try {
        const adminFirestore = await getAdminFirestore();
        const orgDocRef = adminFirestore
            .doc(`organizations/${orgId}`)
            .withConverter(adminDataConverter<Organization>());

        const orgDocSnapshot = await orgDocRef.get();
        const organization = orgDocSnapshot.data();

        if (!organization) {
            sentry.captureException(
                new Error(`Organization with ID ${orgId} does not exist.`)
            );
            return {
                success: false,
                error: new Error(
                    `Organization with ID ${orgId} does not exist.`
                ),
            };
        }

        return {
            success: true,
            data: organization,
        };
    } catch (error) {
        console.error('Error fetching organization:', error);
        return {
            success: false,
            error: new Error('Failed to fetch organization', { cause: error }),
        };
    }
}

import { getUserServerAction } from './userServerActions';

// ...

export async function createOrganizationServerAction(
    data: { [key: string]: string },
    uid: string
): Promise<CreateOrganizationResult> {
    console.log('--- createOrganizationServerAction: Received data ---', data);
    try {
        const userResult = await getUserServerAction(uid);
        if (!userResult.success || !userResult.data) {
            throw new Error(userResult.error?.message || 'User not found');
        }
        const user = userResult.data;

        const adminFirestore = await getAdminFirestore();
        const organizations = adminFirestore.collection('organizations');
        const newOrgRef = organizations.doc();
        const batch = adminFirestore.batch();

        const newOrg = {
            id: newOrgRef.id,
            name: data.name,
            type: data.type as 'personal' | 'company',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: {
                userId: user.id,
                name: user.displayName,
                email: user.email,
            },
            members: {
                [user.id]: { role: 'owner' },
            },
            data: {
                companyName: data.companyName,
                companyWebsite: data.companyWebsite,
                logoURL: data.logoURL,
            },
        };

        console.log(
            '--- createOrganizationServerAction: Creating new org ---',
            newOrg
        );
        batch.set(newOrgRef, newOrg);

        await batch.commit();
        revalidatePath('/orgs');
        return {
            success: true,
            data: {
                orgId: newOrgRef.id,
                message:
                    'Organization created successfully, new Organization ID: ' +
                    newOrgRef.id,
            },
        };
    } catch (error) {
        sentry.captureException(error);
        console.error('--- createOrganizationServerAction: Error ---', error);
        return {
            success: false,
            error: new Error('Failed to create organization', { cause: error }),
        };
    }
}

export async function getAllOrganizationsServerAction() {
    try {
        const adminFirestore = await getAdminFirestore();
        const orgsCollection = adminFirestore
            .collection('organizations')
            .withConverter(adminDataConverter<Organization>());

        const orgsSnapshot = await orgsCollection.get();

        const orgsList: Organization[] = orgsSnapshot.docs.map((doc) =>
            doc.data()
        );
        return {
            success: true,
            data: orgsList,
            message: 'Organizations fetched successfully',
        };
    } catch (error) {
        console.error('Error fetching organizations:', error);
        return {
            success: false,
            error: new Error('Failed to fetch organizations', { cause: error }),
        };
    }
}

export async function addMemberToOrganizationServerAction(
    data: FormData,
    userId: string
): Promise<AddMemberToOrganizationResult> {
    const orgId = data.get('orgId')?.valueOf() as string;
    if (!orgId) {
        const error = new Error('Organization ID is required from FormData.');
        sentry.captureException(error);
        return {
            success: false,
            error,
        };
    }

    try {
        const adminFirestore = await getAdminFirestore();
        const orgRef = adminFirestore.doc(`organizations/${orgId}`);
        const batch = adminFirestore.batch();

        // Update the members map within the organization document
        batch.update(orgRef, {
            [`members.${userId}`]: { role: 'owner' },
        });

        await batch.commit();
        revalidatePath(`/org/${orgId}`); // Revalidate the organization page
        return {
            success: true,
            data: {
                message: 'Member ' + userId + ' added to ' + orgId,
            },
        };
    } catch (error) {
        sentry.captureException(error);
        return {
            success: false,
            error: new Error('Failed to add member to organization', {
                cause: error,
            }),
        };
    }
}

export async function updateOrganizationServerAction(
    orgId: string,
    data: FormData,
    user: User
): Promise<{ success: boolean; error?: Error }> {
    try {
        const adminFirestore = await getAdminFirestore();
        const orgRef = adminFirestore
            .doc(`organizations/${orgId}`)
            .withConverter(adminDataConverter<Organization>());
        const orgDoc = await orgRef.get();

        if (!orgDoc.exists) {
            return {
                success: false,
                error: new Error('Organization not found.'),
            };
        }

        const orgData = orgDoc.data();
        if (orgData?.members?.[user.id] !== 'owner') {
            return {
                success: false,
                error: new Error(
                    "You don't have permission to update this organization."
                ),
            };
        }

        const updatedOrg = {
            name: data.get('name') as string,
            type: data.get('type') as 'personal' | 'company',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            data: {
                companyName: data.get('companyName') as string,
                companyWebsite: data.get('companyWebsite') as string,
                logoURL: data.get('logoURL') as string,
            },
        };

        await adminFirestore.batch().update(orgRef, updatedOrg).commit();
        revalidatePath(`/org/${orgId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating organization:', error);
        return {
            success: false,
            error: new Error('Failed to update organization', { cause: error }),
        };
    }
}

export async function deleteOrganizationServerAction(
    orgId: string
): Promise<{ success: boolean; error?: Error }> {
    try {
        const adminFirestore = await getAdminFirestore();
        const orgRef = adminFirestore
            .doc(`organizations/${orgId}`)
            .withConverter(adminDataConverter<Organization>());
        const orgDoc = await orgRef.get();

        if (!orgDoc.exists) {
            return {
                success: false,
                error: new Error('Organization not found.'),
            };
        }

        await adminFirestore.batch().delete(orgRef).commit();
        revalidatePath('/orgs');
        return { success: true };
    } catch (error) {
        console.error('Error deleting organization:', error);
        return {
            success: false,
            error: new Error('Failed to delete organization', { cause: error }),
        };
    }
}

/**
 * Fetches organizations a user is a member of. This function is crucial for security
 * as it implements the client-side filtering required by Firestore security rules
 * for 'list' operations on the 'organizations' collection.
 * The Firestore rule 'allow list: if isAuthenticated() && isOrgMemberByOrgId(orgId);'
 * relies on this query to ensure only relevant organizations are returned.
 */
export async function getOrganizationsForUserServerAction(userId?: string) {
    console.log(`Fetching organizations for userId: ${userId}`);
    if (!userId) {
        return {
            success: false,
            error: new Error('User ID is required'),
        };
    }

    try {
        const adminFirestore = await getAdminFirestore();
        const orgsCollection = adminFirestore
            .collection('organizations')
            .withConverter(adminDataConverter<Organization>());
        const q = orgsCollection.where(`members.${userId}`, '!=', null);
        console.log(
            `orgServerActions.ts: Querying for organizations where members.${userId} is not null.`
        );
        const querySnapshot = await q.get();
        console.log(
            `orgServerActions.ts: Query snapshot size: ${querySnapshot.size}`
        );
        const organizations = querySnapshot.docs.map((doc) => doc.data());
        console.log(
            `orgServerActions.ts: Fetched organizations:`,
            organizations
        );

        return {
            success: true,
            data: organizations,
        };
    } catch (error) {
        console.error('Error fetching organizations for user:', error);
        return {
            success: false,
            error: new Error('Failed to fetch organizations for user', {
                cause: error,
            }),
        };
    }
}
