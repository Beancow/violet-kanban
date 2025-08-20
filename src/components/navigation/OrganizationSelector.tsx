'use client';
import { useMemo, useState } from 'react';
import { useOrganizationStore } from '@/store/organizationStore';
import { useRouter } from 'next/navigation';
import { DropdownMenu, Button } from '@radix-ui/themes';
import { CaretDownIcon } from '@radix-ui/react-icons';
import CreateOrEditOrganizationModal from '@/components/modals/CreateOrEditOrganizationModal';

export default function OrganizationSelector() {
    const router = useRouter();
    const organizations = useOrganizationStore((s) => s.organizations);
    const currentOrganizationId = useOrganizationStore(
        (s) => s.currentOrganizationId
    );
    const setCurrentOrganizationId = useOrganizationStore(
        (s) => s.setCurrentOrganizationId
    );
    const refetchOrganizations = useOrganizationStore(
        (s) => s.refetchOrganizations
    );
    const [modalOpen, setModalOpen] = useState(false);

    const handleSetCurrentOrg = (orgId: string) => {
        setCurrentOrganizationId(orgId);
        router.push('/boards');
    };

    const handleCreateOrganization = async (orgData: any) => {
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
        setModalOpen(false);
        router.push('/boards');
    };

    const currentOrganization = useMemo(
        () => organizations.find((org) => org.id === currentOrganizationId),
        [organizations, currentOrganizationId]
    );

    return (
        <>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    <Button variant='soft'>
                        {currentOrganization?.name ?? 'Select Organization'}
                        <CaretDownIcon />
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    {organizations.map((org) => (
                        <DropdownMenu.Item
                            key={org.id}
                            onSelect={() => handleSetCurrentOrg(org.id)}
                            disabled={org.id === currentOrganization?.id}
                        >
                            {org.name}
                        </DropdownMenu.Item>
                    ))}
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onSelect={() => setModalOpen(true)}>
                        Create New Organization
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
            <CreateOrEditOrganizationModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onCreate={handleCreateOrganization}
            />
        </>
    );
}
