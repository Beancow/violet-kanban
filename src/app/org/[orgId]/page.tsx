'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/components/AppStateProvider';
import { Organization } from '@/types/appState.type';
import {
    getOrganizationAction,
    updateOrganizationAction,
    deleteOrganizationAction,
} from '@/lib/firebase/orgServerActions';
import OrganizationForm from './components/OrganizationForm';

export default function OrgPage({ params }: { params: { orgId: string } }) {
    const { user } = useAppState();
    const [org, setOrg] = useState<Organization | null>();
    const router = useRouter();

    useEffect(() => {
        const fetchOrg = async () => {
            const { data, success } = await getOrganizationAction(params.orgId);
            if (success && data) {
                setOrg(data);
            }
        };
        if (params.orgId) {
            fetchOrg();
        }
    }, [params.orgId]);

    const handleUpdateOrg = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!org || !org.id) {
            return;
        }
        const formData = new FormData(event.currentTarget);
        const result = await updateOrganizationAction(org.id, formData);
        if (result.success) {
            alert('Organization updated successfully!');
        } else {
            alert(`Error: ${result.error.message}`);
        }
    };

    const handleDeleteOrg = async () => {
        if (!org || !org.id) {
            return;
        }
        const result = await deleteOrganizationAction(org.id);
        if (result.success) {
            alert('Organization deleted successfully!');
            router.push('/orgs');
        } else {
            alert(`Error: ${result.error.message}`);
        }
    };

    if (!org || org === null) {
        return <>Loading ...</>;
    }

    return (
        <OrganizationForm
            org={org}
            user={user}
            onSubmit={handleUpdateOrg}
            onDelete={handleDeleteOrg}
        />
    );
}
