'use client';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { DropdownMenu, Button, Avatar, Flex, Text } from '@radix-ui/themes';

export default function UserMenu() {
    const authUser = useAuthStore((s) => s.authUser);
    const logout = useAuthStore((s) => s.logout);
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/user/login');
    };

    if (!authUser) {
        return null;
    }

    const fallbackEmail = authUser.email || 'U';

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <Button variant='soft'>
                    <Flex gap='2' align='center'>
                        <Avatar
                            size='1'
                            src={authUser.photoURL || undefined}
                            fallback={fallbackEmail[0].toUpperCase()}
                            radius='full'
                        />
                        <Text size='2'>{authUser.email}</Text>
                    </Flex>
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Item onSelect={() => router.push('/user')}>
                    My Profile
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item color='red' onSelect={handleLogout}>
                    Logout
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
