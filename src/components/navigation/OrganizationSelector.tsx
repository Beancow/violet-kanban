'use client';
import { useMemo, useState } from 'react';
import { useOrganizationProvider } from '@/providers/OrganizationProvider';
import useFreshToken from '@/hooks/useFreshToken';
import { useRouter } from 'next/navigation';
import { DropdownMenu, Button } from '@radix-ui/themes';
import { CaretDownIcon } from '@radix-ui/react-icons';
import CreateOrEditOrganizationModal from '@/components/modals/CreateOrEditOrganizationModal';
import OrganizationSelectModal from '@/components/modals/OrganizationSelectModal';
import AvatarWithFallback from '@/components/AvatarWithFallback';
import { z } from 'zod';
import { OrganizationSchema } from '@/schema/organizationSchema';
type OrganizationFormValues = z.infer<typeof OrganizationSchema>;

export default function OrganizationSelector() {
    // hide when not authenticated
    const auth = require('@/providers/AuthProvider').useAuth?.() as any;
    if (auth && !auth.hasAuth) return null;
    const router = useRouter();
    const org = useOrganizationProvider();
    const organizations = org.organizations;
    const currentOrganizationId = org.currentOrganizationId;
    const setCurrentOrganizationId = org.setCurrentOrganizationId;
    const refetchOrganizations = org.refetchOrganizations;
    const [modalOpen, setModalOpen] = useState(false);
    const [selectOpen, setSelectOpen] = useState(false);

    const handleSetCurrentOrg = (orgId: string) => {
        setCurrentOrganizationId(orgId);
        router.push('/boards');
    };

    const getFreshToken = useFreshToken();

    const handleCreateOrganization = async (
        orgData: OrganizationFormValues
    ) => {
        try {
            const token = await getFreshToken();
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch('/api/orgs/create', {
                method: 'POST',
                headers,
                body: JSON.stringify(orgData),
            });
            if (res.ok) {
                // refresh local organizations
                await refetchOrganizations();
            } else {
                const err = await res.json().catch(() => null);
                console.error('Organization create failed', err);
            }
        } catch (err) {
            console.error('OrganizationSelector create error', err);
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
            <style>{`
                /* show org avatar in trigger on screens wider than 768px */
                .vk-org-trigger-large { display: none; }
                @media (min-width: 768px) {
                    .vk-org-trigger-large { display: inline-flex; }
                }
            `}</style>
            {/* If no current organization is selected, hide the dropdown and show a select button */}
            {!currentOrganizationId ? (
                <>
                    <Button variant='soft' onClick={() => setSelectOpen(true)}>
                        Select Organization
                    </Button>
                    <OrganizationSelectModal
                        open={selectOpen}
                        onOpenChange={setSelectOpen}
                        organizations={organizations}
                        onSelect={(id: string) => {
                            handleSetCurrentOrg(id);
                            setSelectOpen(false);
                        }}
                    />
                    <CreateOrEditOrganizationModal
                        open={modalOpen}
                        onOpenChange={setModalOpen}
                        onCreate={handleCreateOrganization}
                    />
                </>
            ) : (
                <>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <Button variant='soft'>
                                <span
                                    style={{
                                        display: 'none',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                    className='vk-org-trigger-large'
                                >
                                    {/* Avatar on large screens */}
                                    <AvatarWithFallback
                                        size={20}
                                        src={
                                            currentOrganization?.logoURL ||
                                            undefined
                                        }
                                        fallback={(
                                            currentOrganization?.name || '??'
                                        )
                                            .split(' ')
                                            .map((p) => p[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()}
                                    />
                                </span>
                                <span style={{ marginLeft: 8 }}>
                                    {currentOrganization?.name ??
                                        'Select Organization'}
                                </span>
                                <CaretDownIcon />
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            {organizations.map((org) => (
                                <DropdownMenu.Item
                                    key={org.id}
                                    onSelect={() => handleSetCurrentOrg(org.id)}
                                    disabled={
                                        org.id === currentOrganization?.id
                                    }
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <AvatarWithFallback
                                            size={20}
                                            src={org.logoURL || undefined}
                                            fallback={org.name
                                                .split(' ')
                                                .map((p) => p[0])
                                                .slice(0, 2)
                                                .join('')
                                                .toUpperCase()}
                                        />
                                        <span>{org.name}</span>
                                    </div>
                                </DropdownMenu.Item>
                            ))}
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item
                                onSelect={() => setModalOpen(true)}
                            >
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
            )}
        </>
    );
}
