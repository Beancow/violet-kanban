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

    const handleCreateOrganization = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !authUser) {
            alert('You must be logged in to create an organization.');
            return;
        }

        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        const idToken = await authUser.getIdToken();

        const result = await fetch('/api/orgs/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(data),
        }).then(res => res.json());

        if (result.success) {
            alert('Organization created successfully!');
            await refetchOrganizations();
            setCurrentOrganization(result.data.orgId);
            router.push('/boards');
        } else {
            alert(`Error creating organization: ${result.error?.message}`);
        }
    };

    return (
        <OrganizationForm onSubmit={handleCreateOrganization} />
    );
}