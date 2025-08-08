'use client';
import { useUser } from '@/contexts/UserProvider';
import OrganizationForm from '@/app/components/forms/OrganizationForm';
import { createOrganizationAction } from '@/lib/firebase/orgServerActions';
import { useRouter } from 'next/navigation';

export default function CreateOrgPage() {
    const { user } = useUser();
    const router = useRouter();

    const handleCreateOrg = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) {
            alert('You must be logged in to create an organization.');
            return;
        }
        const formData = new FormData(event.currentTarget);
        const result = await createOrganizationAction(formData, user);
        if (result.success) {
            router.push(`/boards`);
        } else {
            alert(`Error: ${result.error.message}`);
        }
    };

    return <OrganizationForm user={user} onSubmit={handleCreateOrg} />;
}
