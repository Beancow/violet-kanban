'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { useBoardData } from '@/contexts/BoardDataProvider';

export default function Breadcrumbs() {
    const pathname = usePathname();
    const { boards } = useBoardData();
    const pathSegments = pathname.split('/').filter(Boolean);

    const breadcrumbs = pathSegments.map((segment, index) => {
        const prevSegment = pathSegments[index - 1];
        let path = `/${pathSegments.slice(0, index + 1).join('/')}`;
        let label = segment; // Default to the segment itself

        if (prevSegment === 'board') {
            const board = boards.find(b => b.id === segment);
            label = board ? board.name : segment; // Use board name or fall back to ID
        } else if (segment === 'board') {
            label = 'Boards';
            path = '/boards';
        } else {
            label = segment.charAt(0).toUpperCase() + segment.slice(1);
        }
        
        return { label, path, originalSegment: segment };
    });

    return (
        <Flex align='center' gap='2'>
            <Link href='/'>
                <Text size='2' color='gray'>Home</Text>
            </Link>
            
            {breadcrumbs.map((crumb, index) => {
                // This logic now correctly skips the "board" part of the path,
                // as it has been replaced by the "Boards" link.
                if (crumb.originalSegment === 'board') {
                    return (
                        <Fragment key={crumb.path}>
                            <ChevronRightIcon width='16' height='16' />
                            <Link href={crumb.path}>
                                <Text size='2' color={'gray'}>
                                    {crumb.label}
                                </Text>
                            </Link>
                        </Fragment>
                    );
                }

                // Render the final segment (the board name or other page)
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
