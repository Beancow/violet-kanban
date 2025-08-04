'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserProvider';
import { Organization } from '@/types/appState.type';
import {
    getOrganizationAction,
    updateOrganizationAction,
    deleteOrganizationAction,
} from '@/lib/firebase/orgServerActions';
import OrganizationForm from '@/app/components/forms/OrganizationForm';

export default function OrgPage({ params }: { params: { orgId: string } }) {
    const { user } = useUser();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchOrg = async () => {
            const { data, success } = await getOrganizationAction(params.orgId);
            if (success && data) {
                setOrganization(data);
            }
        };
        if (params.orgId) {
            fetchOrg();
        }
    }, [params.orgId]);

    const handleUpdateOrg = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!organization || !organization.id) {
            return;
        }
        const formData = new FormData(event.currentTarget);
        const result = await updateOrganizationAction(
            organization.id,
            formData
        );
        if (result.success) {
            alert('Organization updated successfully!');
        } else {
            alert(`Error: ${result.error.message}`);
        }
    };

    const handleDeleteOrg = async () => {
        if (!organization || !organization.id) {
            return;
        }
        const result = await deleteOrganizationAction(organization.id);
        if (result.success) {
            alert('Organization deleted successfully!');
            router.push('/orgs');
        } else {
            alert(`Error: ${result.error.message}`);
        }
    };

    if (!organization) {
        return <>Loading ...</>;
    }

    return (
        <OrganizationForm
            organization={organization}
            user={user}
            onSubmit={handleUpdateOrg}
            onDelete={handleDeleteOrg}
        />
    );
}
