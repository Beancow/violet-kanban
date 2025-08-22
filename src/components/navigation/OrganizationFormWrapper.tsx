import { useOrganizationStore } from '@/store/organizationStore';
import OrganizationForm from '../forms/OrganizationForm';
import { Organization } from '@/types/appState.type';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    OrganizationFormValues,
    OrganizationSchema,
} from '@/schema/organizationSchema';

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
    const form = useForm<OrganizationFormValues>({
        resolver: zodResolver(OrganizationSchema),
        defaultValues: {
            name: organization?.name ?? '',
            orgType: organization?.orgType ?? 'company',
            companyName: organization?.companyName ?? '',
            companyWebsite: organization?.companyWebsite ?? '',
            logoURL: organization?.logoURL ?? '',
        },
    });

    const handleSubmit = async (orgData: OrganizationFormValues) => {
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
        <OrganizationForm
            onSubmit={handleSubmit}
            organization={organization}
            form={form}
        />
    );
}
