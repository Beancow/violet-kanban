'use client';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { ChevronRightIcon } from '@radix-ui/react-icons';

interface BreadcrumbItem {
    label: string;
    path: string;
}

export default function Breadcrumbs() {
    const pathname = usePathname();
    const { currentOrganizationId, currentOrganization } = useOrganizations();
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

    useEffect(() => {
        const generateBreadcrumbs = async () => {
            const pathSegments = pathname
                .split('/')
                .filter((segment) => segment);
            const newBreadcrumbs: BreadcrumbItem[] = [];
            let currentPath = '';

            for (let i = 0; i < pathSegments.length; i++) {
                const segment = pathSegments[i];
                currentPath += `/${segment}`;

                let label = segment;
                // Attempt to fetch more descriptive labels for IDs
                if (segment.length === 20) {
                    // Heuristic for Firestore IDs
                    if (currentPath.includes('/orgs/') && i === 1) {
                        // Organization ID
                        const { data } = await fetch(
                            `/api/orgs/${segment}`
                        ).then((res) => res.json());
                        if (data) {
                            label = data.name;
                        }
                    } else if (currentPath.includes('/board/') && i === 2) {
                        // Board ID
                        if (currentOrganizationId) {
                            const { data } = await fetch(
                                `/api/boards/${segment}`
                            ).then((res) => res.json());
                            if (data) {
                                label = data.title;
                            }
                        }
                    }
                }

                newBreadcrumbs.push({
                    label: label.charAt(0).toUpperCase() + label.slice(1),
                    path: currentPath,
                });
            }
            setBreadcrumbs(newBreadcrumbs);
        };

        generateBreadcrumbs();
    }, [pathname, currentOrganizationId]);

    return (
        <Flex align='center' gap='1'>
            <Link href='/'>
                <Text size='2' color='gray'>
                    Home
                </Text>
            </Link>
            {currentOrganization && (
                <Text size='2' color='gray'>
                    {currentOrganization.name}
                </Text>
            )}
            {breadcrumbs.map((crumb, index) => (
                <Fragment key={crumb.path}>
                    <ChevronRightIcon width='16' height='16' />
                    <Link href={crumb.path}>
                        <Text
                            size='2'
                            color={
                                index === breadcrumbs.length - 1
                                    ? 'blue'
                                    : 'gray'
                            }
                        >
                            {crumb.label}
                        </Text>
                    </Link>
                </Fragment>
            ))}
        </Flex>
    );
}
