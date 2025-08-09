'use client';
import { Flex } from '@radix-ui/themes';
import Breadcrumbs from './Breadcrumbs';
import OrganizationSelector from './OrganizationSelector';
import UserMenu from './UserMenu';

export default function Header() {
    return (
        <Flex align='center' justify='between' p='2' style={{ borderBottom: '1px solid var(--gray-a5)' }}>
            <Flex align='center' gap='3'>
                <Breadcrumbs />
            </Flex>
            <Flex align='center' gap='3'>
                <OrganizationSelector />
                <UserMenu />
            </Flex>
        </Flex>
    );
}