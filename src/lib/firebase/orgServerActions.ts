import { firebaseDB } from '@/lib/firebase/firebase-config';
import {
    Organization,
    OrganizationMember,
    CreateOrganizationResult,
    AddMemberToOrganizationResult,
    User,
} from '@/types/appState.type';
import {
    doc,
    addDoc,
    getDoc,
    getDocs,
    collection,
    writeBatch,
    query,
    where,
} from 'firebase/firestore';

import { dataConverter } from './dataConverter';
import * as sentry from '@sentry/nextjs';
import { hasPermission } from './utils/hasPermission';

async function getOrgMembersAction(
    orgId: string
): Promise<OrganizationMember[]> {
    const orgCollection = collection(
        firebaseDB,
        `organizations/${orgId}/members`
    ).withConverter(dataConverter<OrganizationMember>());
    try {
        const orgSnapshot = await getDocs(orgCollection);
        const orgMembers: OrganizationMember[] = orgSnapshot.docs.map((doc) =>
            doc.data()
        );
        return orgMembers;
    } catch (error) {
        sentry.captureException(error);
        console.error('Error fetching organization members:', error);
        return [];
    }
}

export async function getOrganizationAction(orgId: string) {
    if (!hasPermission(orgId, 'member')) {
        return {
            success: false,
            error: new Error(
                'User does not have permission to view organization'
            ),
        };
    }
    const orgDoc = doc(firebaseDB, `organizations/${orgId}`).withConverter(dataConverter<Organization>());
    const orgMembers = await getOrgMembersAction(orgId);

    if (!orgMembers || orgMembers.length === 0) {
        console.warn(
            `No members found for organization: ${orgId}. 
This should not happen.`
        );
        sentry.captureException(
            new Error(`No members found for organization: ${orgId}`)
        );
    }

    try {
        const orgDocSnapshot = await getDoc(orgDoc);
        if (!orgDocSnapshot.exists()) {
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
        const organization: Organization = orgDocSnapshot.data();
        if (!organization) {
            sentry.captureException(
                new Error(
                    `Failed to convert organization document for ${orgId}`
                )
            );
        }
        const composedOrganization = {
            ...organization,
            members: orgMembers,
        };
        return {
            success: true,
            data: composedOrganization,
        };
    } catch (error) {
        console.error('Error fetching organization:', error);
        return {
            success: false,
            error: new Error('Failed to fetch organization', { cause: error }),
        };
    }
}

export async function createOrganizationAction(
    data: FormData,
    user: User
): Promise<CreateOrganizationResult> {
    const organizations = collection(firebaseDB, 'organizations');
    const newOrgRef = doc(organizations);
    const batch = writeBatch(firebaseDB);

    const newOrg = {
        id: newOrgRef.id,
        name: data.get('name') as string,
        type: data.get('type') as 'personal' | 'company',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: {
            userId: user.id,
            name: user.displayName,
            email: user.email,
        },
        members: {
            [user.id]: { role: 'owner' },
        },
        data: {
            companyName: data.get('companyName') as string,
            companyWebsite: data.get('companyWebsite') as string,
            logoURL: data.get('logoURL') as string,
        },
    };

    batch.set(newOrgRef, newOrg);

    const userRef = doc(firebaseDB, 'users', user.id);
    const updatedUser = { ...user, currentOrganizationId: newOrgRef.id };
    batch.set(userRef, updatedUser, { merge: true });

    // Set the first organization as the default
    if (!user.currentOrganizationId) {
        batch.update(userRef, { currentOrganizationId: newOrgRef.id });
    }

    try {
        await batch.commit();
        return {
            success: true,
            data: {
                orgId: newOrgRef.id,
                message:
                    'Organization created successfully, new Organization ID: '
                    + newOrgRef.id,
            },
        };
    } catch (error) {
        console.error('Error creating organization:', error);
        return {
            success: false,
            error: new Error('Failed to create organization', { cause: error }),
        };
    }
}

export async function getAllOrganizationsAction() {
    const orgsCollection = collection(firebaseDB, 'organizations').withConverter(dataConverter<Organization>());

    try {
        const orgsSnapshot = await getDocs(orgsCollection);

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

export async function addMemberToOrganizationAction(
    data: FormData
): Promise<AddMemberToOrganizationResult> {
    const orgId = data.get('orgId')?.valueOf() as string;
    if (!hasPermission(orgId, 'admin')) {
        return {
            success: false,
            error: new Error('User does not have permission to add members'),
        };
    }
    const orgMembers = collection(firebaseDB, `organizations/${orgId}/members`);

    try {
        const orgData = await addDoc(orgMembers, data);
        const orgMemberData =
            orgData.withConverter(dataConverter<OrganizationMember>());
        sentry.captureMessage(
            `Member added to organization: ${orgId}, Member ID: ${orgMemberData.id}`
        );
        return {
            success: true,
            data: {
                message:
                    'orgMemberId:' + orgMemberData.id + ' added to ' + orgId,
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

export async function updateOrganizationAction(
    orgId: string,
    data: FormData
): Promise<{ success: boolean; error?: any }> {
    if (!hasPermission(orgId, 'admin')) {
        return {
            success: false,
            error: new Error(
                'User does not have permission to update organization'
            ),
        };
    }

    const orgRef = doc(firebaseDB, 'organizations', orgId);
    const updatedOrg = {
        name: data.get('name') as string,
        type: data.get('type') as 'personal' | 'company',
        updatedAt: new Date(),
        data: {
            companyName: data.get('companyName') as string,
            companyWebsite: data.get('companyWebsite') as string,
            logoURL: data.get('logoURL') as string,
        },
    };

    try {
        await writeBatch(firebaseDB).update(orgRef, updatedOrg).commit();
        return { success: true };
    } catch (error) {
        console.error('Error updating organization:', error);
        return { success: false, error };
    }
}

export async function deleteOrganizationAction(
    orgId: string
): Promise<{ success: boolean; error?: any }> {
    if (!hasPermission(orgId, 'owner')) {
        return {
            success: false,
            error: new Error(
                'User does not have permission to delete organization'
            ),
        };
    }

    const orgRef = doc(firebaseDB, 'organizations', orgId);

    try {
        await writeBatch(firebaseDB).delete(orgRef).commit();
        return { success: true };
    } catch (error) {
        console.error('Error deleting organization:', error);
        return { success: false, error };
    }
}

export async function getOrganizationsForUserAction(userId: string) {
    try {
        const orgsCollection = collection(firebaseDB, 'organizations').withConverter(dataConverter<Organization>());
        const q = query(orgsCollection, where(`members.${userId}`, '!=', null));
        const querySnapshot = await getDocs(q);
        const organizations = querySnapshot.docs.map((doc) =>
            doc.data()
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
