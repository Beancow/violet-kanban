'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { BoardForm } from '@/app/components/forms/BoardForm';
import LoadingPage from '@/components/LoadingPage';
import { useAppToast } from '@/hooks/useToast';
import { useData } from '@/contexts/DataProvider';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useState } from 'react';

export default function CreateBoardPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const { authUser } = useAuth();
    const { currentOrganizationId, loading: orgsLoading } = useOrganizations();
    const { showToast } = useAppToast();
    const { createBoard } = useData();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateBoard = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        if (isSubmitting) return; // Prevent double submission
        setIsSubmitting(true);

        if (!user || !authUser || !currentOrganizationId) {
            showToast(
                'Error',
                'You must be logged in and belong to an organization to create a board.'
            );
            setIsSubmitting(false);
            return;
        }

        const formData = new FormData(event.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;

        createBoard(title, description);

        showToast('Success', 'Board added to queue!');
        router.push('/boards');
    };

    if (userLoading || orgsLoading) {
        return <LoadingPage dataType='board' />;
    }

    return <BoardForm user={user} onSubmit={handleCreateBoard} />;
}
