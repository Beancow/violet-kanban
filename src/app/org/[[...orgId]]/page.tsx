'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/components/AppStateProvider';
import { Organization } from '@/types/appState.type';
import {
    getOrganizationAction,
    createOrganizationAction,
    updateOrganizationAction,
    deleteOrganizationAction,
} from '@/lib/firebase/orgServerActions';
import OrganizationList from './components/OrganizationList';
import OrganizationForm from './components/OrganizationForm';

import BoardsPage from './components/boards/BoardsPage';

import { useSearchParams } from 'next/navigation';

export default function OrgPage({ params }: { params: { orgId: string[] } }) {
    const { user, organizations } = useAppState();
    const [org, setOrg] = useState<Organization | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const changeDefault = searchParams.get('changeDefault');
        if (user?.currentOrganizationId && !params.orgId && !changeDefault) {
            router.push(`/org/${user.currentOrganizationId}/boards`);
        }
    }, [user, params.orgId, router, searchParams]);

    useEffect(() => {
        if (params.orgId && params.orgId.length > 0) {
            const fetchOrg = async () => {
                const { data, success } = await getOrganizationAction(
                    params.orgId[0]
                );
                if (success && data) {
                    setOrg(data);
                }
            };
            fetchOrg();
        }
    }, [params.orgId]);

    const handleCreateOrg = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) {
            alert('You must be logged in to create an organization.');
            return;
        }
        const formData = new FormData(event.currentTarget);
        const result = await createOrganizationAction(formData, user);
        if (result.success) {
            alert('Organization created successfully!');
            router.push(`/org/${result.data.orgId}/boards`);
        } else {
            alert(`Error: ${result.error.message}`);
        }
    };

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
            router.push('/org');
        } else {
            alert(`Error: ${result.error.message}`);
        }
    };

    if (
        params.orgId &&
        params.orgId.length > 1 &&
        params.orgId[1] === 'boards'
    ) {
        return <BoardsPage params={{ orgId: params.orgId[0] }} />;
    }

    if (organizations.length > 0 && !params.orgId) {
        return <OrganizationList organizations={organizations} />;
    }

    return (
        <OrganizationForm
            org={org}
            user={user}
            onSubmit={org ? handleUpdateOrg : handleCreateOrg}
            onDelete={org ? handleDeleteOrg : undefined}
        />
    );
}
