import { Dialog } from '@radix-ui/themes';
import type { Organization } from '@/types/appState.type';
import OrganizationForm from '@/components/forms/OrganizationForm';

interface CreateOrganizationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (orgData: any) => void;
    organization?: Organization;
    isEdit?: boolean;
}

export default function CreateOrganizationModal({
    open,
    onOpenChange,
    onCreate,
    organization,
    isEdit = false,
}: CreateOrganizationModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content>
                <Dialog.Title>
                    {isEdit ? 'Edit Organization' : 'Create Organization'}
                </Dialog.Title>
                <OrganizationForm
                    organization={organization}
                    isEdit={isEdit}
                    onSubmit={(orgData) => {
                        onCreate(orgData);
                    }}
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}
