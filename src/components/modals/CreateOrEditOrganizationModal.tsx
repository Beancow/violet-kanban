import { Dialog } from '@radix-ui/themes';
import type { Organization } from '@/types/appState.type';
import OrganizationForm from '../forms/OrganizationForm';
import { z } from 'zod';
import { OrganizationSchema } from '@/schema/organizationSchema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
type OrganizationFormValues = z.infer<typeof OrganizationSchema>;

interface CreateOrganizationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (orgData: OrganizationFormValues) => void;
    organization?: Organization;
}

export default function CreateOrganizationModal({
    open,
    onOpenChange,
    onCreate,
    organization,
}: CreateOrganizationModalProps) {
    const form = useForm<OrganizationFormValues>({
        resolver: zodResolver(OrganizationSchema),
        defaultValues: organization
            ? (organization as unknown as OrganizationFormValues)
            : { name: '', type: 'personal' },
    });
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content>
                <Dialog.Title>
                    {organization?.id
                        ? 'Edit Organization'
                        : 'Create Organization'}
                </Dialog.Title>
                <OrganizationForm
                    organization={organization}
                    form={form}
                    onSubmit={(orgData) => {
                        onCreate(orgData);
                    }}
                />
            </Dialog.Content>
        </Dialog.Root>
    );
}
