'use client';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useBoardData } from '@/contexts/BoardDataProvider';

import { Box, Heading, Text, Button, Flex } from '@radix-ui/themes';
import Link from 'next/link';
import LoadingPage from '@/components/LoadingPage';
import { useRequireOrganization } from '@/hooks/useRequireOrganization';

export default function UserBoardsPage() {
    useRequireOrganization();
    const { currentOrganizationId, organizations, loading: orgsLoading } = useOrganizations();
    const { boards } = useBoardData();
    
    const currentOrg = organizations.find(
        (org) => org.id === currentOrganizationId
    );

    if (orgsLoading) {
        return <LoadingPage dataType='boards' />;
    }

    

    return (
        <Box pt='8'>
            <Heading as='h1' size='6' align='center' mb='5'>
                {`${currentOrg?.name ?? 'Your'} Boards`}
            </Heading>
            <Flex direction='column' gap='4' align='center'>
                {boards.length > 0 ? (
                    boards.map((board) => (
                        <Link
                            href={`/board/${board.id}`}
                            key={board.id}
                            style={{
                                textDecoration: 'none',
                                width: '100%',
                                maxWidth: '500px',
                            }}
                        >
                            <Button
                                variant='soft'
                                size='3'
                                style={{ width: '100%' }}
                            >
                                {board.title}
                            </Button>
                        </Link>
                    ))
                ) : (
                    <Text>No boards found for this organization.</Text>
                )}
                <Link
                    href='/board/create'
                    style={{
                        textDecoration: 'none',
                        width: '100%',
                        maxWidth: '500px',
                    }}
                >
                    <Button variant='solid' size='3' style={{ width: '100%' }}>
                        Create New Board
                    </Button>
                </Link>
            </Flex>
        </Box>
    );
}
