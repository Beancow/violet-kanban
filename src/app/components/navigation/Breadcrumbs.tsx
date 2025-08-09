'use client';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { Flex, Text, DropdownMenu, Button } from '@radix-ui/themes';
import { ChevronRightIcon, CaretDownIcon } from '@radix-ui/react-icons';

export default function Breadcrumbs() {
    const pathname = usePathname();
    const router = useRouter();
    const { organizations, currentOrganization, setCurrentOrganization } = useOrganizations();

    const handleSetCurrentOrg = (orgId: string) => {
        setCurrentOrganization(orgId);
        // Navigate to the org's board list after switching
        router.push('/boards');
    };

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
        // Capitalize the segment for display, you can add more sophisticated logic here if needed
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);
        return { label, path };
    });

    return (
        <Flex align='center' gap='2' p='2' style={{ borderBottom: '1px solid var(--gray-a5)' }}>
            <Link href='/'>
                <Text size='2' color='gray'>Home</Text>
            </Link>
            <ChevronRightIcon width='16' height='16' />
            
            {currentOrganization && (
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <Button variant="soft">
                            {currentOrganization.name}
                            <CaretDownIcon />
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        {organizations.map(org => (
                            <DropdownMenu.Item 
                                key={org.id} 
                                onSelect={() => handleSetCurrentOrg(org.id)}
                                disabled={org.id === currentOrganization.id}
                            >
                                {org.name}
                            </DropdownMenu.Item>
                        ))}
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item onSelect={() => router.push('/org/create')}>
                            Create New Organization
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            )}

            {breadcrumbs.map((crumb, index) => {
                // Don't show the root 'Boards' or 'Orgs' link as it's implied by the org dropdown
                if (crumb.label === 'Boards' || crumb.label === 'Orgs') return null;

                return (
                    <Fragment key={crumb.path}>
                        <ChevronRightIcon width='16' height='16' />
                        <Link href={crumb.path}>
                            <Text
                                size='2'
                                color={index === breadcrumbs.length - 1 ? 'blue' : 'gray'}
                            >
                                {crumb.label}
                            </Text>
                        </Link>
                    </Fragment>
                );
            })}
        </Flex>
    );
}