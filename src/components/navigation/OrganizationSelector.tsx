'use client';
import { useMemo, useState } from 'react';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useRouter } from 'next/navigation';
import { DropdownMenu, Button } from '@radix-ui/themes';
import { CaretDownIcon } from '@radix-ui/react-icons';
import CreateOrEditOrganizationModal from '@/components/modals/CreateOrEditOrganizationModal';
import { useData } from '@/contexts/DataProvider';

export default function OrganizationSelector() {
    const router = useRouter();
    const { organizations, currentOrganizationId, setCurrentOrganization } =
        useOrganizations();
    const { queueCreateOrganization } = useData();
    const [modalOpen, setModalOpen] = useState(false);

    const handleSetCurrentOrg = (orgId: string) => {
        setCurrentOrganization(orgId);
        // Navigate to the org's board list after switching
        router.push('/boards');
    };

    const handleCreateOrganization = (orgData: any) => {
        queueCreateOrganization(orgData);
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
