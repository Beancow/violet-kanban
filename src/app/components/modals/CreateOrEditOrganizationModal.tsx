'use client';
import { Dialog } from '@radix-ui/themes';
import type { Organization } from '@/types/appState.type';
import OrganizationForm from '@/components/forms/OrganizationForm';
import { OrganizationSchema } from '@/schema/organizationSchema';

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
    const onSubmit = async (data: any) => {
        const result = OrganizationSchema.safeParse(data);
        console.log('Zod validation result:', result);
        // If using handleSubmit from react-hook-form, errors should be handled automatically
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content>
                <Dialog.Title>
                    {isEdit ? 'Edit Organization' : 'Create Organization'}
                </Dialog.Title>
                <OrganizationForm
                    organization={organization}
                    isEdit={isEdit}
                    onSubmit={onSubmit}
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}
