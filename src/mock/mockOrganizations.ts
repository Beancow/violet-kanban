import type { Organization } from '@/types/appState.type';

export const mockOrganizations: Organization[] = [
    {
        id: 'org-1',
        name: 'Demo Organization',
        orgType: 'company',
        members: {
            'user-1': 'owner',
            'user-2': 'member',
        },
        companyName: 'Demo Co.',
        companyWebsite: 'https://demo.co',
        logoURL: 'https://placehold.co/64x64',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: {
            userId: 'user-1',
            name: 'Demo Owner',
            email: 'owner@demo.co',
        },
    },
];
