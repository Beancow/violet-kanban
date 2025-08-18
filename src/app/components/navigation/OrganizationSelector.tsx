'use client';
import { useState } from 'react';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useRouter } from 'next/navigation';
import { DropdownMenu, Button } from '@radix-ui/themes';
import { CaretDownIcon } from '@radix-ui/react-icons';
import CreateOrganizationModal from '@/app/components/modals/CreateOrganizationModal';

export default function OrganizationSelector() {
    const router = useRouter();
    const { organizations, currentOrganization, setCurrentOrganization } =
        useOrganizations();
    const [modalOpen, setModalOpen] = useState(false);

    const handleSetCurrentOrg = (orgId: string) => {
        setCurrentOrganization(orgId);
        // Navigate to the org's board list after switching
        router.push('/boards');
    };

    const handleCreateOrganization = (orgData: any) => {
        // Add your organization creation logic here
        // For example: createOrganization(orgData);
    };

    if (!currentOrganization) {
        return null;
    }

    return (
        <>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    <Button variant='soft'>
                        {currentOrganization.name}
                        <CaretDownIcon />
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    {organizations.map((org) => (
                        <DropdownMenu.Item
                            key={org.id}
                            onSelect={() => handleSetCurrentOrg(org.id)}
                            disabled={org.id === currentOrganization.id}
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
            <CreateOrganizationModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onCreate={handleCreateOrganization}
            />
        </>
    );
}
