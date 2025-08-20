import { useOrganizationStore } from '@/store/organizationStore';
import OrganizationForm from '../forms/OrganizationForm';
import { Organization } from '@/types/appState.type';

export default function OrganizationFormWrapper({
    onClose,
    organization,
}: {
    onClose?: () => void;
    organization?: Organization;
}) {
    const refetchOrganizations = useOrganizationStore(
        (s) => s.refetchOrganizations
    );

    const handleSubmit = async (orgData: {
        name: string;
        orgType: 'company' | 'personal' | 'private';
        companyName?: string;
        companyWebsite?: string;
        logoURL?: string;
    }) => {
        try {
            const res = await fetch('/api/orgs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orgData),
            });
            if (res.ok) {
                await refetchOrganizations();
            } else {
                // TODO: Show error to user
            }
        } catch (err) {
            // TODO: Show error to user
        }
        if (onClose) onClose();
    };

    return (
        <OrganizationForm onSubmit={handleSubmit} organization={organization} />
    );
}
