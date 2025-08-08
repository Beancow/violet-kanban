import { createOrganizationServerAction } from '@/lib/firebase/orgServerActions';
import { useUser } from '@/contexts/UserProvider';
import { OrganizationForm } from '@/app/components/forms/OrganizationForm';

export default function CreateOrganizationPage() {
    const { user } = useUser();

    const handleCreateOrganization = async (formData: FormData) => {
        if (!user) {
            alert('You must be logged in to create an organization.');
            return;
        }

        const result = await createOrganizationServerAction(formData, user);

        if (result.success) {
            alert('Organization created successfully!');
        } else {
            alert(`Error creating organization: ${result.error?.message}`);
        }
    };

    return (
        <OrganizationForm onSubmit={handleCreateOrganization} />
    );
}
