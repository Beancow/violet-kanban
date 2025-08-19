import { useData } from '@/contexts/DataProvider';
import OrganizationForm from '../forms/OrganizationForm';
import { Organization } from '@/types/appState.type';

export default function OrganizationFormWrapper({
    onClose,
    organization,
}: {
    onClose?: () => void;
    organization?: Organization;
}) {
    const { queueCreateOrganization } = useData?.() || {};

    const handleSubmit = async (orgData: {
        name: string;
        orgType: 'company' | 'personal' | 'private';
        companyName?: string;
        companyWebsite?: string;
        logoURL?: string;
    }) => {
        queueCreateOrganization(orgData);

        if (onClose) onClose();
    };

    return (
        <OrganizationForm onSubmit={handleSubmit} organization={organization} />
    );
}
