import { firebaseGetFirestore } from '@/lib/firebase/firebase-config';
import { Organization, OrganizationMember, CreateOrganizationResult, AddMemberToOrganizationResult } from '@/types/appState.type';
import { doc, addDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { dataConverter } from './dataConverter';
import * as sentry from '@sentry/nextjs';
import { hasPermission } from './utils/hasPermission';

const db = firebaseGetFirestore();

async function getOrgMembersAction(
    orgId: string
): Promise<OrganizationMember[]> {
    const orgCollection = collection(db, `organizations/${orgId}/members`);
    try {
        const orgSnapshot = await getDocs(orgCollection);
        const orgMembers: OrganizationMember[] = orgSnapshot.docs.map((doc) =>
            doc.data().withConverter(dataConverter<OrganizationMember>()) 
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
            error: new Error('User does not have permission to view organization'),
        };
    }
    const orgDoc = doc(db, `organizations/${orgId}`);
    const orgMembers = await getOrgMembersAction(orgId);

    if (!orgMembers || orgMembers.length === 0) {
        console.warn(
            `No members found for organization: ${orgId}. \nThis should not happen.`
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
        const organization: Organization = orgDocSnapshot
            .data()
            .withConverter(dataConverter<Organization>());
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

export async function createOrganizationAction(data: FormData, userId: string): Promise<CreateOrganizationResult> {
    const organizations = collection(db, 'organizations');
    const newOrg = {
        name: data.get('name') as string,
        type: data.get('type') as 'personal' | 'company',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: {
            userId: userId,
            name: data.get('creatorName') as string,
            email: data.get('creatorEmail') as string,
        },
        members: {
            [userId]: { role: 'owner' },
        },
        data: {
            companyName: data.get('companyName') as string,
            companyWebsite: data.get('companyWebsite') as string,
            logoURL: data.get('logoURL') as string,
        },
    };

    try {
        const orgDoc = await addDoc(organizations, newOrg);
        return {
            success: true,
            data: {
                orgId: orgDoc.id,
                message:
                    'Organization created successfully, new Organization ID: ' +
                    orgDoc.id,
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
    const orgsCollection = collection(db, 'organizations');

    try {
        const orgsSnapshot = await getDocs(orgsCollection);

        const orgsList: Organization[] = orgsSnapshot.docs.map((doc) =>
            doc.data().withConverter(dataConverter<Organization>()) 
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

export async function addMemberToOrganizationAction(data: FormData): Promise<AddMemberToOrganizationResult> {
  const orgId = data.get("orgId")?.valueOf() as string;
  if (!hasPermission(orgId, "admin")) {
    return {
      success: false,
      error: new Error("User does not have permission to add members"),
    };
  }
  const orgMembers = collection(db, `organizations/${orgId}/members`);

  try {
    const orgData = await addDoc(orgMembers, data);
    const orgMemberData = orgData.withConverter(
      dataConverter<OrganizationMember>()
    );
    sentry.captureMessage(
      `Member added to organization: ${orgId}, Member ID: ${orgMemberData.id}`
    );
    return {
      success: true,
      data: {
        message: "orgMemberId:" + orgMemberData.id + " added to " + orgId,
      },
    };
  } catch (error) {
    sentry.captureException(error);
    return {
      success: false,
      error: new Error("Failed to add member to organization", {
        cause: error,
      }),
    };
  }
}
