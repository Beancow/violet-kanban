'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserProvider';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import OrganizationForm from '@/app/components/forms/OrganizationForm';
import { useAuth } from '@/contexts/AuthProvider';

export default function CreateOrganizationPage() {
    const router = useRouter();
    const { user } = useUser();
    const { authUser } = useAuth();
    const { setCurrentOrganization, refetchOrganizations } = useOrganizations();

    const handleCreateOrganization = async (formData: FormData) => {
        if (!user || !authUser) {
            alert('You must be logged in to create an organization.');
            return;
        }

        const idToken = await authUser.getIdToken();

        const result = await fetch('/api/orgs/create', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
            body: formData,
        }).then(res => res.json());

        if (result.success) {
            alert('Organization created successfully!');
            // Refetch the organizations list to include the new one
            await refetchOrganizations();
            // Set the new org as the current one
            setCurrentOrganization(result.data.orgId);
            // Redirect to the boards page
            router.push('/boards');
        } else {
            alert(`Error creating organization: ${result.error?.message}`);
        }
    };

    return (
        <OrganizationForm onSubmit={handleCreateOrganization} />
    );
}