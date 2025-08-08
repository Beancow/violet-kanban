'use client';

import { Fragment, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Flex, Text } from '@radix-ui/themes';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { getBoardAction } from '@/lib/firebase/boardServerActions';
import { getOrganizationAction } from '@/lib/firebase/orgServerActions';
import { useUser } from '@/contexts/UserProvider';

interface BreadcrumbItem {
    label: string;
    href: string;
}

const pluralMap: { [key: string]: { label: string; href: string } } = {
    'board': { label: 'Boards', href: '/boards' },
    'org': { label: 'Organizations', href: '/orgs' },
    // Add other singular/plural mappings here if needed
};

export default function Breadcrumbs() {
    const pathname = usePathname();
    const { currentOrganizationId } = useUser();
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

    useEffect(() => {
        const generateBreadcrumbs = async () => {
            const pathSegments = pathname.split('/').filter(Boolean);
            const newBreadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

            let currentPath = '';
            for (let i = 0; i < pathSegments.length; i++) {
                const segment = pathSegments[i];
                const nextSegment = pathSegments[i + 1]; // Look ahead

                let label = segment;
                let href = currentPath + `/${segment}`; // Default href for the current segment

                // Check if the current segment is a singular resource name followed by an ID
                if (pluralMap[segment] && nextSegment && nextSegment.length === 20) { // Heuristic for Firebase IDs
                    label = pluralMap[segment].label;
                    href = pluralMap[segment].href; // Link to the plural list page
                } else if (segment.length === 20) { // Heuristic for Firebase IDs
                    // This is an ID segment, fetch its name
                    // The pathSegments[i-1] check ensures we only try to fetch names for known resource types
                    if (pathSegments[i - 1] === 'org') {
                        if (currentOrganizationId) {
                            const { data } = await getOrganizationAction(segment);
                            if (data) {
                                label = data.name;
                            }
                        }
                    } else if (pathSegments[i - 1] === 'board') {
                        if (currentOrganizationId) {
                            const { data } = await getBoardAction(currentOrganizationId, segment);
                            if (data) {
                                label = data.title;
                            }
                        }
                    }
                }

                newBreadcrumbs.push({ label, href });
                currentPath += `/${segment}`; // Update currentPath for the next iteration's default href
            }
            setBreadcrumbs(newBreadcrumbs);
        };

        generateBreadcrumbs();
    }, [pathname, currentOrganizationId]);

    return (
        <Flex align='center' gap='1' py='2' px='4' style={{ borderBottom: '1px solid var(--gray-a3)' }}>
            {breadcrumbs.map((crumb, index) => (
                <Fragment key={crumb.href}>
                    <Link href={crumb.href} passHref>
                        <Text
                            size='2'
                            color={index === breadcrumbs.length - 1 ? 'blue' : 'gray'}
                            weight={index === breadcrumbs.length - 1 ? 'bold' : 'regular'}
                            style={{ cursor: 'pointer' }}
                        >
                            {crumb.label}
                        </Text>
                    </Link>
                    {index < breadcrumbs.length - 1 && (
                        <ChevronRightIcon width='16' height='16' />
                    )}
                </Fragment>
            ))}
        </Flex>
    );
}
