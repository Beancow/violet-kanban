'use client';
import { useAppState } from '@/components/AppStateProvider';
import OrganizationForm from './components/OrganizationForm';
import { updateOrganizationAction } from '@/lib/firebase/orgServerActions';
import { useRouter } from 'next/navigation';

export default function CreateOrgPage() {
    const { user } = useAppState();
    const router = useRouter();

    const handleCreateOrg = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) {
            alert('You must be logged in to create an organization.');
            return;
        }
        const formData = new FormData(event.currentTarget);
        const result = await updateOrganizationAction(
            formData.get('orgId') as string,
            formData
        );
        if (result.success) {
            alert('Organization created successfully!');
            router.push(`/org/${formData.get('orgId')}/boards`);
        } else {
            alert(`Error: ${result.error.message}`);
        }
    };

    return <OrganizationForm user={user} onSubmit={handleCreateOrg} />;
}
